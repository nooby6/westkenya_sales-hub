from datetime import date
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.catalog import Customer, Depot, Product
from app.models.enums import OrderStatus
from app.models.order import OrderItem, SalesOrder
from app.schemas.auth import AuthenticatedUser
from app.schemas.order import (
    CustomerLookup,
    DepotLookup,
    OrderCreateRequest,
    OrderCreateResponse,
    OrderListItem,
    ProductLookup,
    QuantityLookup,
)
from app.services.inventory_service import ensure_and_deduct, get_products_map


async def list_orders(
    session: AsyncSession,
    status_filter: OrderStatus | None,
    depot_id: str | None = None,
    product_id: str | None = None,
    quantity: int | None = None,
) -> list[OrderListItem]:
    statement = (
        select(
            SalesOrder,
            Customer.name.label("customer_name"),
            Customer.company_name.label("customer_company_name"),
            Depot.name.label("depot_name"),
        )
        .join(Customer, Customer.id == SalesOrder.customer_id)
        .join(Depot, Depot.id == SalesOrder.depot_id)
        .order_by(SalesOrder.created_at.desc())
    )
    if status_filter is not None:
        statement = statement.where(SalesOrder.status == status_filter)
    if depot_id is not None:
        statement = statement.where(SalesOrder.depot_id == depot_id)
    if product_id is not None or quantity is not None:
        statement = statement.join(OrderItem, OrderItem.order_id == SalesOrder.id)
    if product_id is not None:
        statement = statement.where(OrderItem.product_id == product_id)
    if quantity is not None:
        statement = statement.where(OrderItem.quantity == quantity)

    rows = (await session.execute(statement)).all()
    return [
        OrderListItem(
            id=row.SalesOrder.id,
            order_number=row.SalesOrder.order_number,
            status=row.SalesOrder.status,
            total_amount=float(row.SalesOrder.total_amount),
            order_date=row.SalesOrder.order_date,
            created_at=row.SalesOrder.created_at,
            customer_id=row.SalesOrder.customer_id,
            customer_name=row.customer_name,
            customer_company_name=row.customer_company_name,
            depot_id=row.SalesOrder.depot_id,
            depot_name=row.depot_name,
        )
        for row in rows
    ]


async def list_customers(session: AsyncSession) -> list[CustomerLookup]:
    customers = (
        await session.execute(select(Customer).where(Customer.is_active.is_(True)).order_by(Customer.name.asc()))
    ).scalars().all()
    return [CustomerLookup(id=c.id, name=c.name, company_name=c.company_name) for c in customers]


async def list_depots(session: AsyncSession) -> list[DepotLookup]:
    depots = (await session.execute(select(Depot).where(Depot.is_active.is_(True)).order_by(Depot.name.asc()))).scalars().all()
    return [DepotLookup(id=d.id, name=d.name) for d in depots]


async def list_products(session: AsyncSession) -> list[ProductLookup]:
    products = (
        await session.execute(select(Product).where(Product.is_active.is_(True)).order_by(Product.name.asc()))
    ).scalars().all()
    return [ProductLookup(id=p.id, name=p.name, unit_price=float(p.unit_price)) for p in products]


async def list_quantities(session: AsyncSession) -> list[QuantityLookup]:
    quantities = (
        await session.execute(select(distinct(OrderItem.quantity)).order_by(OrderItem.quantity.asc()))
    ).scalars().all()
    return [QuantityLookup(value=quantity) for quantity in quantities if quantity is not None]


def _build_order_number() -> str:
    return f"ORD-{uuid4().hex[:10].upper()}"


async def process_order(
    session: AsyncSession,
    payload: OrderCreateRequest,
    actor: AuthenticatedUser,
) -> OrderCreateResponse:
    if not payload.items:
        raise ValueError("At least one order item is required.")

    requested_items = {item.product_id: item.quantity for item in payload.items}
    async with session.begin():
        products = await get_products_map(session=session, product_ids=list(requested_items.keys()))
        await ensure_and_deduct(session=session, depot_id=payload.depot_id, requested_items=requested_items)

        total_amount = Decimal("0.00")
        order = SalesOrder(
            order_number=_build_order_number(),
            customer_id=payload.customer_id,
            depot_id=payload.depot_id,
            sales_rep_id=actor.user_id,
            notes=payload.notes,
            total_amount=Decimal("0.00"),
            status=OrderStatus.pending,
            order_date=date.today(),
        )
        session.add(order)
        await session.flush()

        for item in payload.items:
            product = products[item.product_id]
            unit_price = Decimal(str(item.unit_price)) if item.unit_price is not None else Decimal(str(product.unit_price))
            line_total = unit_price * item.quantity
            total_amount += line_total

            session.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    total_price=line_total,
                )
            )

        order.total_amount = total_amount

        session.add(
            AuditLog(
                actor_user_id=actor.user_id,
                action="order.created",
                entity_type="order",
                entity_id=order.id,
                metadata={
                    "customer_id": payload.customer_id,
                    "depot_id": payload.depot_id,
                    "item_count": len(payload.items),
                    "total_amount": float(total_amount),
                },
            )
        )

    return OrderCreateResponse(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        total_amount=float(order.total_amount),
        order_date=order.order_date,
    )


async def update_order_status(
    session: AsyncSession,
    order_id: str,
    new_status: OrderStatus,
    actor: AuthenticatedUser,
) -> None:
    async with session.begin():
        order = (await session.execute(select(SalesOrder).where(SalesOrder.id == order_id).with_for_update())).scalar_one_or_none()
        if order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        previous_status = order.status
        order.status = new_status

        session.add(
            AuditLog(
                actor_user_id=actor.user_id,
                action="order.status_updated",
                entity_type="order",
                entity_id=order.id,
                metadata={"from": previous_status.value, "to": new_status.value},
            )
        )
