from fastapi import APIRouter, Depends

from app.core.rbac import require_permission
from app.schemas.auth import AuthenticatedUser
from app.schemas.notification import NotificationRequest, NotificationResponse
from app.services.notification_service import queue_notification

router = APIRouter()


@router.post("", response_model=NotificationResponse)
async def send_notification(
    payload: NotificationRequest,
    current_user: AuthenticatedUser = Depends(require_permission("order:write")),
) -> NotificationResponse:
    _ = current_user
    return queue_notification(payload)
