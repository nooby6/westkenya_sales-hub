from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Inventory, Product


async def get_products_map(session: AsyncSession, product_ids: Sequence[str]) -> dict[str, Product]:
    statement = select(Product).where(Product.id.in_(product_ids), Product.is_active.is_(True))
    products = (await session.execute(statement)).scalars().all()
    product_map = {product.id: product for product in products}
    missing = [product_id for product_id in product_ids if product_id not in product_map]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown or inactive products: {', '.join(missing)}",
        )
    return product_map


async def ensure_and_deduct(
    session: AsyncSession,
    depot_id: str,
    requested_items: dict[str, int],
) -> dict[str, Inventory]:
    statement = (
        select(Inventory)
        .where(Inventory.depot_id == depot_id, Inventory.product_id.in_(requested_items.keys()))
        .with_for_update()
    )
    inventory_rows = (await session.execute(statement)).scalars().all()
    inventory_by_product = {row.product_id: row for row in inventory_rows}

    missing_inventory = [
        product_id for product_id in requested_items.keys() if product_id not in inventory_by_product
    ]
    if missing_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory rows not found for products: {', '.join(missing_inventory)}",
        )

    for product_id, qty in requested_items.items():
        row = inventory_by_product[product_id]
        if row.quantity < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient inventory for '{product_id}'. "
                    f"Requested {qty}, available {row.quantity}."
                ),
            )

    for product_id, qty in requested_items.items():
        inventory_by_product[product_id].quantity -= qty

    return inventory_by_product
