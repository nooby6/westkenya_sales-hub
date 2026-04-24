from uuid import uuid4

from app.schemas.auth import AuthenticatedUser
from app.schemas.order import OrderCreateRequest, OrderCreateResponse
from app.services.audit_service import build_audit_event
from app.services.inventory_service import ensure_and_deduct


def process_order(payload: OrderCreateRequest, actor: AuthenticatedUser) -> tuple[OrderCreateResponse, dict]:
    if not payload.items:
        raise ValueError("At least one order item is required.")

    requested_items = {item.product_id: item.quantity for item in payload.items}
    deducted_items = ensure_and_deduct(depot_id=payload.depot_id, requested_items=requested_items)

    order_id = f"ord-{uuid4()}"
    audit_event = build_audit_event(
        actor_id=actor.user_id,
        action="order.created",
        entity_type="order",
        entity_id=order_id,
        metadata={
            "customer_id": payload.customer_id,
            "depot_id": payload.depot_id,
            "deducted_items": deducted_items,
        },
    )

    response = OrderCreateResponse(
        order_id=order_id,
        status="confirmed",
        deducted_items=deducted_items,
    )
    return response, audit_event
