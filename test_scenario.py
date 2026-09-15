from datetime import date
from fastapi.testclient import TestClient
from main import app, ProductDB, SessionLocal

client = TestClient(app)

def test_hackathon_verification_scenario():
    # Clear DB
    db = SessionLocal()
    db.query(ProductDB).delete()
    db.commit()
    db.close()

    today_str = date.today().isoformat()
    current_year = date.today().year
    current_month = date.today().month

    # 1. Add 3 expenses
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

    # 2. Check summary: total 3000, Еда 2400, Транспорт 600
    res_summary = client.get(f"/api/products/summary?year={current_year}&month={current_month}")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total_amount"] == 3000.0
    assert summary["total_count"] == 3

    categories = {c["category"]: c["total_amount"] for c in summary["category_breakdown"]}
    assert categories["Еда"] == 2400.0
    assert categories["Транспорт"] == 600.0

    # 3. Delete expense with 900
    del_res = client.delete(f"/api/products/{p3['id']}")
    assert del_res.status_code == 200

    # 4. Check summary again: total 2100, Еда 1500, Транспорт 600
    res_summary2 = client.get(f"/api/products/summary?year={current_year}&month={current_month}")
    assert res_summary2.status_code == 200
    summary2 = res_summary2.json()
    assert summary2["total_amount"] == 2100.0
    assert summary2["total_count"] == 2

    categories2 = {c["category"]: c["total_amount"] for c in summary2["category_breakdown"]}
    assert categories2["Еда"] == 1500.0
    assert categories2["Транспорт"] == 600.0

    # 5. Test invalid amount (<= 0)
    neg_res = client.post("/api/products", json={
        "category": "Еда",
        "amount": -50.0,
        "date": today_str
    })
    assert neg_res.status_code == 422

    print("ALL TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_hackathon_verification_scenario()
