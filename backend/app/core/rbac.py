from collections.abc import Callable
from enum import Enum

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_user
from app.schemas.auth import AuthenticatedUser


class Role(str, Enum):
    driver = "driver"
    sales_rep = "sales_rep"
    supervisor = "supervisor"
    manager = "manager"
    ceo = "ceo"


ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.driver: {"shipment:read_own", "shipment:update_own"},
    Role.sales_rep: {"order:create", "order:read", "inventory:read"},
    Role.supervisor: {"order:write", "report:read", "user:manage"},
    Role.manager: {"*"},
    Role.ceo: {"*"},
}


def require_permission(permission: str) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    def checker(current_user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        role = Role(current_user.role)
        permissions = ROLE_PERMISSIONS.get(role, set())
        if "*" in permissions or permission in permissions:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for this operation.",
        )

    return checker
