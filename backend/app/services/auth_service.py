from app.core.security import create_access_token, get_password_hash, verify_password

# Starter users; replace with DB-backed identities in phase 2.
_USERS = {
    "manager@westkenya.local": {
        "id": "u-manager-1",
        "email": "manager@westkenya.local",
        "password_hash": get_password_hash("ChangeMe123"),
        "role": "manager",
    },
    "sales@westkenya.local": {
        "id": "u-sales-1",
        "email": "sales@westkenya.local",
        "password_hash": get_password_hash("ChangeMe123"),
        "role": "sales_rep",
    },
}


def authenticate_user(email: str, password: str) -> str | None:
    user = _USERS.get(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return create_access_token(
        subject=user["id"],
        extra_claims={"email": user["email"], "role": user["role"]},
    )
