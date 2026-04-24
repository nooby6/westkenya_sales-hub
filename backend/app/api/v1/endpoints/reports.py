from fastapi import APIRouter, Depends, HTTPException, status

from app.core.rbac import require_permission
from app.schemas.auth import AuthenticatedUser
from app.schemas.report import ReportRequest, ReportResponse
from app.services.report_service import queue_report

router = APIRouter()


@router.post("", response_model=ReportResponse)
async def generate_report(
    payload: ReportRequest,
    current_user: AuthenticatedUser = Depends(require_permission("report:read")),
) -> ReportResponse:
    _ = current_user
    try:
        return queue_report(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
