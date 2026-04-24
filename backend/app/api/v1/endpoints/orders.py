from fastapi import APIRouter, Depends, HTTPException, status

from app.core.rbac import require_permission
from app.schemas.auth import AuthenticatedUser
from app.schemas.order import OrderCreateRequest, OrderCreateResponse
from app.services.order_service import process_order

router = APIRouter()


@router.post("", response_model=OrderCreateResponse)
async def create_order(
    payload: OrderCreateRequest,
    current_user: AuthenticatedUser = Depends(require_permission("order:create")),
) -> OrderCreateResponse:
    try:
        response, audit_event = process_order(payload=payload, actor=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # TODO: Persist audit_event once database models are wired.
    _ = audit_event
    return response
