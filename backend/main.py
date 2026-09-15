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


Base.metadata.create_all(bind=engine)


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

    class Config:
        from_attributes = True


class CategorySummary(BaseModel):
    category: str = Field(..., description="Категория")
    total_amount: float = Field(..., description="Сумма расходов по категории")
    count: int = Field(..., description="Количество записей")
    percentage: float = Field(..., description="Процент от общего итога")


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

    return SummaryResponse(
        year=year,
        month=month,
        total_amount=total_amount,
        total_count=total_count,
        category_breakdown=category_breakdown,
        monthly_breakdown=monthly_breakdown,
        items=items,
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
        ProductDB(category="Еда", amount=1500.0, date=today, description="Продукты на неделю"),
        ProductDB(category="Транспорт", amount=600.0, date=today, description="Проездной"),
        ProductDB(category="Еда", amount=900.0, date=today, description="Обед в кафе"),
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
