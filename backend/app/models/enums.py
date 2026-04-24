from enum import Enum


class AppRole(str, Enum):
    driver = "driver"
    sales_rep = "sales_rep"
    supervisor = "supervisor"
    manager = "manager"
    ceo = "ceo"


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    dispatched = "dispatched"
    delivered = "delivered"
    cancelled = "cancelled"
