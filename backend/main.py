import os
from datetime import date as dt_date, datetime
from enum import Enum
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import Column, Date, Float, Integer, String, Text, create_engine, extract
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from dotenv import load_dotenv

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expenses.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Enum categories
class ProductCategory(str, Enum):
    FOOD = "Еда"
    TRANSPORT = "Транспорт"
    HOUSING = "Жилье"
    ENTERTAINMENT = "Развлечения"
    EDUCATION = "Образование"
    HEALTH = "Здоровье"
    CLOTHES = "Одежда"
    OTHER = "Другое"


# SQLAlchemy DB Model
class ProductDB(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=True)
    recipient = Column(String(100), nullable=True)


Base.metadata.create_all(bind=engine)

# Простая миграция: добавляем колонку recipient в уже существующую БД
with engine.begin() as conn:
    from sqlalchemy import inspect, text

    cols = [c["name"] for c in inspect(conn).get_columns("products")]
    if "recipient" not in cols:
        conn.execute(text("ALTER TABLE products ADD COLUMN recipient VARCHAR(100)"))


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic Schemas
class ProductBase(BaseModel):
    category: ProductCategory = Field(
        ...,
        description="Категория расхода (Еда, Транспорт, Жилье, Развлечения, Образование, Здоровье, Одежда, Другое)",
        examples=["Еда"],
    )
    amount: float = Field(
        ...,
        gt=0,
        description="Сумма расхода (строго положительное число)",
        examples=[1500.0],
    )
    date: dt_date = Field(
        ...,
        description="Дата расхода в формате ГГГГ-ММ-ДД",
        examples=["2026-09-15"],
    )
    description: Optional[str] = Field(
        None,
        description="Необязательное описание расхода",
        examples=["Обед в столовой"],
    )
    recipient: Optional[str] = Field(
        None,
        max_length=100,
        description="На кого потратили (необязательно): я, друзья, семья...",
        examples=["я"],
    )

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Сумма расхода должна быть строго больше 0")
        return round(v, 2)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    category: Optional[ProductCategory] = Field(None, description="Категория расхода")
    amount: Optional[float] = Field(None, gt=0, description="Сумма расхода (строго > 0)")
    date: Optional[dt_date] = Field(None, description="Дата расхода")
    description: Optional[str] = Field(None, description="Необязательное описание")
    recipient: Optional[str] = Field(None, max_length=100, description="На кого потратили")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Сумма расхода должна быть строго больше 0")
        return round(v, 2) if v is not None else None


class ProductResponse(BaseModel):
    id: int = Field(..., description="Уникальный идентификатор расхода")
    category: str = Field(..., description="Категория расхода")
    amount: float = Field(..., description="Сумма расхода")
    date: dt_date = Field(..., description="Дата расхода")
    description: Optional[str] = Field(None, description="Описание расхода")
    recipient: Optional[str] = Field(None, description="На кого потратили")

    class Config:
        from_attributes = True


class CategorySummary(BaseModel):
    category: str = Field(..., description="Категория")
    total_amount: float = Field(..., description="Сумма расходов по категории")
    count: int = Field(..., description="Количество записей")
    percentage: float = Field(..., description="Процент от общего итога")


class RecipientSummary(BaseModel):
    recipient: str = Field(..., description="Получатель / на кого потратили")
    total_amount: float = Field(..., description="Сумма")
    count: int = Field(..., description="Количество записей")


class MonthBreakdown(BaseModel):
    month: int = Field(..., description="Номер месяца (1-12)")
    month_name: str = Field(..., description="Название месяца")
    total_amount: float = Field(..., description="Сумма за месяц")
    count: int = Field(..., description="Количество записей")


class SummaryResponse(BaseModel):
    year: int = Field(..., description="Год")
    month: Optional[int] = Field(None, description="Выбранный месяц (если указан)")
    total_amount: float = Field(..., description="Общий итог расходов")
    total_count: int = Field(..., description="Всего записей")
    category_breakdown: List[CategorySummary] = Field(
        ..., description="Разбивка расходов по категориям для круговой диаграммы"
    )
    monthly_breakdown: Optional[List[MonthBreakdown]] = Field(
        None, description="Разбивка по месяцам для столбчатого графика"
    )
    items: List[ProductResponse] = Field(
        ..., description="Полный список всех трат за выбранный период для фронтенда и графиков"
    )
    recipient_breakdown: List[RecipientSummary] = Field(
        default_factory=list, description="Итоги по получателям («на кого потратили»)"
    )
    previous_total: Optional[float] = Field(
        None, description="Итог за предыдущий месяц (для сравнения), если указан month"
    )
    avg_per_day: float = Field(0.0, description="Средний расход в день за период")
    max_expense: Optional[ProductResponse] = Field(None, description="Самая крупная трата периода")


MONTH_NAMES = [
    "",
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
]

# FastAPI App
app = FastAPI(
    title="Учёт личных расходов студента API",
    description="REST API для учёта и аналитики расходов студента. Поддерживает CRUD операции сущности products, детальную аналитику по месяцам и годам, и полную спецификацию Swagger UI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware (Fully open for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def redirect_to_docs():
    """Перенаправление на интерактивную документацию Swagger UI."""
    return RedirectResponse(url="/docs")


@app.get("/api/categories", tags=["Справочники"], summary="Список доступных категорий")
def get_categories():
    """Возвращает список доступных категорий для выпадающего списка на фронтенде."""
    return [{"name": cat.value, "key": cat.name} for cat in ProductCategory]


# CRUD: Create
@app.post(
    "/api/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Расходы (Products)"],
    summary="Добавить расход",
)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Создает новую запись расхода:
    - **category**: Категория (Enum)
    - **amount**: Положительная сумма (> 0)
    - **date**: Дата расхода (ГГГГ-ММ-ДД)
    - **description**: Необязательное описание
    """
    db_product = ProductDB(
        category=product.category.value,
        amount=product.amount,
        date=product.date,
        description=product.description,
        recipient=(product.recipient or "").strip() or None,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# CRUD: Read List (All expenses or filtered)
@app.get(
    "/api/products",
    response_model=List[ProductResponse],
    tags=["Расходы (Products)"],
    summary="Получить список всех расходов (с фильтрами по году, месяцу, категории)",
)
def list_products(
    year: Optional[int] = Query(None, description="Фильтр по году, например 2026"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Фильтр по месяцу (1-12)"),
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    db: Session = Depends(get_db),
):
    """
    Возвращает список всех расходов.
    Если параметры не переданы — возвращает абсолютно ВСЕ траты для построения графиков на фронте.
    """
    query = db.query(ProductDB)

    if year is not None:
        query = query.filter(extract("year", ProductDB.date) == year)
    if month is not None:
        query = query.filter(extract("month", ProductDB.date) == month)
    if category is not None:
        query = query.filter(ProductDB.category == category)

    return query.order_by(ProductDB.date.desc(), ProductDB.id.desc()).all()


# Analytics / Summary: get API на получение итогов расходов за год и месяц + все траты периода
@app.get(
    "/api/products/summary",
    response_model=SummaryResponse,
    tags=["Аналитика и итоги"],
    summary="Получить итоги расходов за год и месяц + все траты для графиков",
)
def get_products_summary(
    year: int = Query(..., description="Год для расчета итогов, например 2026"),
    month: Optional[int] = Query(
        None, ge=1, le=12, description="Месяц (1-12). Если не указан — итоги за весь год"
    ),
    db: Session = Depends(get_db),
):
    """
    Возвращает:
    - **total_amount**: общий итог расходов (строго равен сумме категорий)
    - **total_count**: количество записей
    - **category_breakdown**: структура расходов по категориям (для Pie / Donut Chart)
    - **monthly_breakdown**: помесячная динамика (для Bar / Line Chart)
    - **items**: все траты за выбранный период
    """
    query = db.query(ProductDB).filter(extract("year", ProductDB.date) == year)
    if month is not None:
        query = query.filter(extract("month", ProductDB.date) == month)

    records = query.order_by(ProductDB.date.desc(), ProductDB.id.desc()).all()

    total_amount = round(sum(r.amount for r in records), 2)
    total_count = len(records)

    # Категории
    category_map = {}
    for r in records:
        cat = r.category
        if cat not in category_map:
            category_map[cat] = {"amount": 0.0, "count": 0}
        category_map[cat]["amount"] += r.amount
        category_map[cat]["count"] += 1

    category_breakdown = []
    for cat, data in sorted(category_map.items(), key=lambda x: x[1]["amount"], reverse=True):
        cat_amount = round(data["amount"], 2)
        pct = round((cat_amount / total_amount * 100), 2) if total_amount > 0 else 0.0
        category_breakdown.append(
            CategorySummary(
                category=cat,
                total_amount=cat_amount,
                count=data["count"],
                percentage=pct,
            )
        )

    # Помесячная разбивка года (для графиков динамики)
    monthly_breakdown = []
    all_year_records = (
        db.query(ProductDB).filter(extract("year", ProductDB.date) == year).all()
    )
    monthly_map = {m: {"amount": 0.0, "count": 0} for m in range(1, 13)}
    for r in all_year_records:
        m = r.date.month
        monthly_map[m]["amount"] += r.amount
        monthly_map[m]["count"] += 1

    for m in range(1, 13):
        monthly_breakdown.append(
            MonthBreakdown(
                month=m,
                month_name=MONTH_NAMES[m],
                total_amount=round(monthly_map[m]["amount"], 2),
                count=monthly_map[m]["count"],
            )
        )

    items = [ProductResponse.model_validate(r) for r in records]

    # По получателям
    recipient_map = {}
    for r in records:
        key = r.recipient or "Не указано"
        recipient_map.setdefault(key, {"amount": 0.0, "count": 0})
        recipient_map[key]["amount"] += r.amount
        recipient_map[key]["count"] += 1
    recipient_breakdown = [
        RecipientSummary(recipient=k, total_amount=round(v["amount"], 2), count=v["count"])
        for k, v in sorted(recipient_map.items(), key=lambda x: x[1]["amount"], reverse=True)
    ] if any(r.recipient for r in records) else []

    # Предыдущий месяц
    previous_total = None
    if month is not None:
        py, pm = (year - 1, 12) if month == 1 else (year, month - 1)
        prev = (
            db.query(ProductDB)
            .filter(extract("year", ProductDB.date) == py, extract("month", ProductDB.date) == pm)
            .all()
        )
        previous_total = round(sum(r.amount for r in prev), 2)

    # Средний в день
    import calendar

    if month is not None:
        today = dt_date.today()
        if year == today.year and month == today.month:
            days = today.day
        else:
            days = calendar.monthrange(year, month)[1]
    else:
        days = 366 if calendar.isleap(year) else 365
    avg_per_day = round(total_amount / days, 2) if days else 0.0

    max_expense = max(records, key=lambda r: r.amount) if records else None

    return SummaryResponse(
        recipient_breakdown=recipient_breakdown,
        previous_total=previous_total,
        avg_per_day=avg_per_day,
        max_expense=ProductResponse.model_validate(max_expense) if max_expense else None,
        year=year,
        month=month,
        total_amount=total_amount,
        total_count=total_count,
        category_breakdown=category_breakdown,
        monthly_breakdown=monthly_breakdown,
        items=items,
    )


# Export CSV
@app.get(
    "/api/products/export.csv",
    tags=["Аналитика и итоги"],
    summary="Экспорт расходов за период в CSV",
)
def export_csv(
    year: int = Query(...),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    import csv
    import io

    from fastapi.responses import Response

    query = db.query(ProductDB).filter(extract("year", ProductDB.date) == year)
    if month is not None:
        query = query.filter(extract("month", ProductDB.date) == month)
    rows = query.order_by(ProductDB.date.asc(), ProductDB.id.asc()).all()

    buf = io.StringIO()
    buf.write("\ufeff")  # BOM для Excel
    w = csv.writer(buf, delimiter=";")
    w.writerow(["Дата", "Категория", "Сумма", "Описание", "На кого"])
    for r in rows:
        w.writerow([r.date.isoformat(), r.category, f"{r.amount:.2f}", r.description or "", r.recipient or ""])
    w.writerow([])
    w.writerow(["Итого", "", f"{sum(r.amount for r in rows):.2f}", "", ""])
    name = f"expenses-{year}-{month:02d}.csv" if month else f"expenses-{year}.csv"
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


# CRUD: Read Single
@app.get(
    "/api/products/{product_id}",
    response_model=ProductResponse,
    tags=["Расходы (Products)"],
    summary="Получить расход по ID",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Возвращает информацию о расходе по его ID."""
    db_product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Расход с ID {product_id} не найден",
        )
    return db_product


# CRUD: Update Full
@app.put(
    "/api/products/{product_id}",
    response_model=ProductResponse,
    tags=["Расходы (Products)"],
    summary="Обновить расход полностью",
)
def update_product_put(
    product_id: int, product: ProductCreate, db: Session = Depends(get_db)
):
    """Полное обновление записи расхода."""
    db_product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Расход с ID {product_id} не найден",
        )

    db_product.category = product.category.value
    db_product.amount = product.amount
    db_product.date = product.date
    db_product.description = product.description
    db_product.recipient = (product.recipient or "").strip() or None

    db.commit()
    db.refresh(db_product)
    return db_product


# CRUD: Update Partial
@app.patch(
    "/api/products/{product_id}",
    response_model=ProductResponse,
    tags=["Расходы (Products)"],
    summary="Частично обновить расход",
)
def update_product_patch(
    product_id: int, product: ProductUpdate, db: Session = Depends(get_db)
):
    """Частичное обновление полей записи расхода."""
    db_product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Расход с ID {product_id} не найден",
        )

    if product.category is not None:
        db_product.category = product.category.value
    if product.amount is not None:
        db_product.amount = product.amount
    if product.date is not None:
        db_product.date = product.date
    if product.description is not None:
        db_product.description = product.description
    db_product.recipient = (product.recipient or "").strip() or None

    db.commit()
    db.refresh(db_product)
    return db_product


# CRUD: Delete
@app.delete(
    "/api/products/{product_id}",
    status_code=status.HTTP_200_OK,
    tags=["Расходы (Products)"],
    summary="Удалить расход",
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Удаляет запись расхода по ID."""
    db_product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Расход с ID {product_id} не найден",
        )

    db.delete(db_product)
    db.commit()
    return {"message": f"Расход с ID {product_id} успешно удален", "id": product_id}


# CRUD: Delete all
@app.delete(
    "/api/products",
    status_code=status.HTTP_200_OK,
    tags=["Расходы (Products)"],
    summary="Удалить все расходы",
)
def delete_all_products(db: Session = Depends(get_db)):
    """Полностью очищает список расходов (используется кнопкой «Очистить всё»)."""
    deleted = db.query(ProductDB).delete()
    db.commit()
    return {"message": "Все расходы удалены", "deleted": deleted}


@app.get("/api/health", tags=["Служебные"], summary="Проверка доступности")
def health():
    return {"status": "ok"}


# Seed / Reset helper for testing hackathon scenario
@app.post(
    "/api/seed",
    tags=["Тестирование и инициализация"],
    summary="Загрузить тестовые данные проверочного сценария (1500, 600, 900)",
)
def seed_test_data(db: Session = Depends(get_db)):
    """
    Сбрасывает базу и наполняет её контрольным примером из ТЗ:
    1. Еда — 1500
    2. Транспорт — 600
    3. Еда — 900
    Итог: 3000 (Еда: 2400, Транспорт: 600).
    """
    db.query(ProductDB).delete()
    today = dt_date.today()

    sample_items = [
        ProductDB(category="Еда", amount=1500.0, date=today, description="Продукты на неделю", recipient="я"),
        ProductDB(category="Транспорт", amount=600.0, date=today, description="Проездной", recipient="я"),
        ProductDB(category="Еда", amount=900.0, date=today, description="Обед в кафе", recipient="друзья"),
    ]
    db.add_all(sample_items)
    db.commit()

    return {
        "message": "База успешно наполнена контрольным примером из ТЗ",
        "count": len(sample_items),
        "expected_initial_total": 3000.0,
        "expected_after_deleting_900": 2100.0,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8001")),
        reload=True,
    )
