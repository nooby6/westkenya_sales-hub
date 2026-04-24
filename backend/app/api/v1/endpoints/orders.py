from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.core.rbac import require_permission
from app.models.enums import OrderStatus
from app.schemas.auth import AuthenticatedUser
from app.schemas.order import (
    CustomerLookup,
    DepotLookup,
    OrderCreateRequest,
    OrderCreateResponse,
    OrderListItem,
    OrderStatusUpdateRequest,
    ProductLookup,
)
from app.services.order_service import (
    list_customers,
    list_depots,
    list_orders,
    list_products,
    process_order,
    update_order_status,
)

router = APIRouter()


@router.get("", response_model=list[OrderListItem])
async def get_orders(
    status_filter: OrderStatus | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("order:read")),
    session: AsyncSession = Depends(get_db_session),
) -> list[OrderListItem]:
    _ = current_user
    return await list_orders(session=session, status_filter=status_filter)


@router.get("/lookups/customers", response_model=list[CustomerLookup])
async def get_customers(
    current_user: AuthenticatedUser = Depends(require_permission("order:create")),
    session: AsyncSession = Depends(get_db_session),
) -> list[CustomerLookup]:
    _ = current_user
    return await list_customers(session)


@router.get("/lookups/depots", response_model=list[DepotLookup])
async def get_depots(
    current_user: AuthenticatedUser = Depends(require_permission("order:create")),
    session: AsyncSession = Depends(get_db_session),
) -> list[DepotLookup]:
    _ = current_user
    return await list_depots(session)


@router.get("/lookups/products", response_model=list[ProductLookup])
async def get_products(
    current_user: AuthenticatedUser = Depends(require_permission("order:create")),
    session: AsyncSession = Depends(get_db_session),
) -> list[ProductLookup]:
    _ = current_user
    return await list_products(session)


@router.post("", response_model=OrderCreateResponse)
async def create_order(
    payload: OrderCreateRequest,
    current_user: AuthenticatedUser = Depends(require_permission("order:create")),
    session: AsyncSession = Depends(get_db_session),
) -> OrderCreateResponse:
    try:
        response = await process_order(session=session, payload=payload, actor=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return response


@router.patch("/{order_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def patch_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    current_user: AuthenticatedUser = Depends(require_permission("order:write")),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    await update_order_status(
        session=session,
        order_id=order_id,
        new_status=payload.status,
        actor=current_user,
    )
