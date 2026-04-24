from pydantic import BaseModel, Field


class OrderItemInput(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class OrderCreateRequest(BaseModel):
    customer_id: str
    depot_id: str
    items: list[OrderItemInput]


class OrderCreateResponse(BaseModel):
    order_id: str
    status: str
    deducted_items: dict[str, int]
