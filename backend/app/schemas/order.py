from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import OrderStatus


class OrderItemInput(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    unit_price: float | None = Field(default=None, gt=0)


class OrderCreateRequest(BaseModel):
    customer_id: str
    depot_id: str
    notes: str | None = None
    items: list[OrderItemInput]


class OrderCreateResponse(BaseModel):
    id: str
    order_number: str
    status: OrderStatus
    total_amount: float
    order_date: date


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus


class CustomerLookup(BaseModel):
    id: str
    name: str
    company_name: str | None = None


class DepotLookup(BaseModel):
    id: str
    name: str


class ProductLookup(BaseModel):
    id: str
    name: str
    unit_price: float


class QuantityLookup(BaseModel):
    value: int


class OrderListItem(BaseModel):
    id: str
    order_number: str
    status: OrderStatus
    total_amount: float
    order_date: date
    created_at: datetime
    customer_id: str
    customer_name: str
    customer_company_name: str | None = None
    depot_id: str
    depot_name: str
