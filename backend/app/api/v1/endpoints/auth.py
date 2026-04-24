from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db_session
from app.schemas.auth import BootstrapAdminRequest, LoginRequest, TokenResponse
from app.services.auth_service import authenticate_user, bootstrap_admin

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    token = await authenticate_user(session=session, email=str(payload.email), password=payload.password)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return TokenResponse(access_token=token)


@router.post("/bootstrap", response_model=TokenResponse)
async def bootstrap(
    payload: BootstrapAdminRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    try:
        token = await bootstrap_admin(session=session, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return TokenResponse(access_token=token)
