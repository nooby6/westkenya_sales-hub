from datetime import date

from pydantic import BaseModel


class ReportRequest(BaseModel):
    from_date: date
    to_date: date
    report_type: str
    format: str


class ReportResponse(BaseModel):
    report_id: str
    format: str
    status: str
