from app.schemas.notification import NotificationRequest
from app.schemas.report import ReportRequest


def process_notification_job(payload: NotificationRequest) -> None:
    # TODO: integrate email/SMS provider clients and retries.
    _ = payload


def process_report_job(payload: ReportRequest) -> None:
    # TODO: generate PDF/XLSX documents and upload to object storage.
    _ = payload
