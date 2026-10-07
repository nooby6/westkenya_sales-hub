from datetime import datetime, timezone
from uuid import uuid4


def build_audit_event(
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    metadata: dict,
) -> dict:
    return {
        "id": str(uuid4()),
        "actor_id": actor_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
