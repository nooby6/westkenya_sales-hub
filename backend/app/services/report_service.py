from uuid import uuid4

from app.schemas.report import ReportRequest, ReportResponse


SUPPORTED_FORMATS = {"pdf", "xlsx"}


def queue_report(payload: ReportRequest) -> ReportResponse:
    normalized_format = payload.format.lower()
    if normalized_format not in SUPPORTED_FORMATS:
        raise ValueError("Unsupported format. Use 'pdf' or 'xlsx'.")

    return ReportResponse(
        report_id=f"rpt-{uuid4()}",
        format=normalized_format,
        status="queued",
    )
