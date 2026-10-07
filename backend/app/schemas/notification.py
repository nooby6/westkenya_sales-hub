from pydantic import BaseModel


class NotificationRequest(BaseModel):
    channel: str
    recipient: str
    subject: str
    message: str


class NotificationResponse(BaseModel):
    queued: bool
    reference: str
