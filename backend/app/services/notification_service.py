from uuid import uuid4

from app.schemas.notification import NotificationRequest, NotificationResponse


def queue_notification(payload: NotificationRequest) -> NotificationResponse:
    # Placeholder for Redis/Celery enqueue.
    return NotificationResponse(queued=True, reference=f"notif-{uuid4()}")
