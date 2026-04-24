from fastapi import HTTPException, status

# Temporary in-memory stock ledger keyed by depot->product->quantity.
_STOCK: dict[str, dict[str, int]] = {
    "depot-main": {"sugar-50kg": 120, "sugar-25kg": 200},
}


def ensure_and_deduct(depot_id: str, requested_items: dict[str, int]) -> dict[str, int]:
    depot_stock = _STOCK.get(depot_id)
    if depot_stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Depot '{depot_id}' not found.",
        )

    for product_id, qty in requested_items.items():
        available = depot_stock.get(product_id, 0)
        if available < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient inventory for '{product_id}'. "
                    f"Requested {qty}, available {available}."
                ),
            )

    for product_id, qty in requested_items.items():
        depot_stock[product_id] -= qty

    return requested_items
