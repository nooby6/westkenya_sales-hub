from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import BootstrapAdminRequest


async def authenticate_user(session: AsyncSession, email: str, password: str) -> str | None:
    statement = select(User).where(User.email == email, User.is_active.is_(True))
    user = (await session.execute(statement)).scalar_one_or_none()
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None

    return create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role.value},
    )


async def bootstrap_admin(session: AsyncSession, payload: BootstrapAdminRequest) -> str:
    user_count = (await session.execute(select(func.count()).select_from(User))).scalar_one()
    if user_count > 0:
        raise ValueError("Bootstrap is disabled because users already exist.")

    user = User(
        email=str(payload.email),
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
    )
    session.add(user)
    await session.flush()

    return create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role.value},
    )
