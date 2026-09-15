from datetime import date
from fastapi.testclient import TestClient
from main import app, ProductDB, SessionLocal

client = TestClient(app)

def test_verification_scenario():
    db = SessionLocal()
    db.query(ProductDB).delete()
    db.commit()
    db.close()

    today_str = date.today().isoformat()
    current_year = date.today().year
    current_month = date.today().month

    r1 = client.post("/api/products", json={
        "category": "Еда",
        "amount": 1500.0,
        "date": today_str,
        "description": "Продукты на неделю"
    })
    assert r1.status_code == 201
    p1 = r1.json()

    r2 = client.post("/api/products", json={
        "category": "Транспорт",
        "amount": 600.0,
        "date": today_str,
        "description": "Проездной"
    })
    assert r2.status_code == 201
    p2 = r2.json()

    r3 = client.post("/api/products", json={
        "category": "Еда",
        "amount": 900.0,
        "date": today_str,
        "description": "Обед в кафе"
    })
    assert r3.status_code == 201
    p3 = r3.json()

    res_summary = client.get(f"/api/products/summary?year={current_year}&month={current_month}")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total_amount"] == 3000.0
    assert summary["total_count"] == 3

    categories = {c["category"]: c["total_amount"] for c in summary["category_breakdown"]}
    assert categories["Еда"] == 2400.0
    assert categories["Транспорт"] == 600.0

    del_res = client.delete(f"/api/products/{p3['id']}")
    assert del_res.status_code == 200

    res_summary2 = client.get(f"/api/products/summary?year={current_year}&month={current_month}")
    assert res_summary2.status_code == 200
    summary2 = res_summary2.json()
    assert summary2["total_amount"] == 2100.0
    assert summary2["total_count"] == 2

    categories2 = {c["category"]: c["total_amount"] for c in summary2["category_breakdown"]}
    assert categories2["Еда"] == 1500.0
    assert categories2["Транспорт"] == 600.0

    neg_res = client.post("/api/products", json={
        "category": "Еда",
        "amount": -50.0,
        "date": today_str
    })
    assert neg_res.status_code == 422


if __name__ == "__main__":
    test_verification_scenario()


def test_delete_all_and_empty_summary():
    client.post("/api/seed")
    r = client.delete("/api/products")
    assert r.status_code == 200
    today = date.today()
    s = client.get(f"/api/products/summary?year={today.year}&month={today.month}").json()
    assert s["total_amount"] == 0 and s["total_count"] == 0 and s["category_breakdown"] == []
