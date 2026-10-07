"""initial schema

Revision ID: 20260424_0001
Revises:
Create Date: 2026-04-24 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260424_0001"
down_revision = None
branch_labels = None
depends_on = None


app_role = sa.Enum("driver", "sales_rep", "supervisor", "manager", "ceo", name="app_role")
order_status = sa.Enum(
    "pending",
    "confirmed",
    "processing",
    "dispatched",
    "delivered",
    "cancelled",
    name="order_status",
)


def upgrade() -> None:
    app_role.create(op.get_bind(), checkfirst=True)
    order_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", app_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "depots",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "inventory",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("depot_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["depot_id"], ["depots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("depot_id", "product_id", name="uq_inventory_depot_product"),
    )
    op.create_index("ix_inventory_depot_id", "inventory", ["depot_id"], unique=False)
    op.create_index("ix_inventory_product_id", "inventory", ["product_id"], unique=False)

    op.create_table(
        "sales_orders",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("order_number", sa.String(length=32), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("depot_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("sales_rep_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="pending"),
        sa.Column("order_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["depot_id"], ["depots.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["sales_rep_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_number"),
    )
    op.create_index("ix_sales_orders_order_number", "sales_orders", ["order_number"], unique=False)

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(14, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["sales_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"], unique=False)
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("action", sa.String(length=128), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"], unique=False)
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"], unique=False)
    op.create_index("ix_audit_logs_entity_id", "audit_logs", ["entity_id"], unique=False)

    op.execute(
        """
        INSERT INTO customers (id, name, company_name, is_active)
        VALUES
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af001', 'Kakamega Traders', 'Kakamega Traders Ltd', true),
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af002', 'Mumias Wholesalers', 'Mumias Wholesalers', true);
        """
    )
    op.execute(
        """
        INSERT INTO depots (id, name, is_active)
        VALUES
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af101', 'Main Depot', true),
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af102', 'Kisumu Depot', true);
        """
    )
    op.execute(
        """
        INSERT INTO products (id, name, unit_price, is_active)
        VALUES
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af201', 'Kabras Sugar 50kg', 6500.00, true),
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af202', 'Kabras Sugar 25kg', 3350.00, true);
        """
    )
    op.execute(
        """
        INSERT INTO inventory (id, depot_id, product_id, quantity)
        VALUES
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af301', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af101', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af201', 300),
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af302', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af101', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af202', 450),
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af303', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af102', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af201', 200),
            ('0f47d8b6-f5b5-4d70-aef5-8ad8f62af304', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af102', '0f47d8b6-f5b5-4d70-aef5-8ad8f62af202', 220);
        """
    )


def downgrade() -> None:
    op.drop_index("ix_audit_logs_entity_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_order_items_product_id", table_name="order_items")
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")

    op.drop_index("ix_sales_orders_order_number", table_name="sales_orders")
    op.drop_table("sales_orders")

    op.drop_index("ix_inventory_product_id", table_name="inventory")
    op.drop_index("ix_inventory_depot_id", table_name="inventory")
    op.drop_table("inventory")

    op.drop_table("products")
    op.drop_table("depots")
    op.drop_table("customers")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    order_status.drop(op.get_bind(), checkfirst=True)
    app_role.drop(op.get_bind(), checkfirst=True)
