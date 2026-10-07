from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.enums import AppRole
from app.schemas.auth import AuthenticatedUser

ROLE_PERMISSIONS: dict[AppRole, set[str]] = {
    AppRole.driver: {"shipment:read_own", "shipment:update_own"},
    AppRole.sales_rep: {"order:create", "order:read", "inventory:read"},
    AppRole.supervisor: {"order:write", "order:read", "report:read", "user:manage"},
    AppRole.manager: {"*"},
    AppRole.ceo: {"*"},
}


def require_permission(permission: str) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    def checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        role = AppRole(current_user.role)
        permissions = ROLE_PERMISSIONS.get(role, set())
        if "*" in permissions or permission in permissions:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for this operation.",
        )

    return checker
