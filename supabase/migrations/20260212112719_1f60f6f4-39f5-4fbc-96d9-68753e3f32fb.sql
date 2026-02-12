-- Enable RLS on sales_orders and customers if not already enabled
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Drivers can read sales orders for their shipments" ON public.sales_orders;
DROP POLICY IF EXISTS "Drivers can read customers for their delivery orders" ON public.customers;

-- Create simpler, more reliable policies for drivers
CREATE POLICY "drivers_read_sales_orders"
ON public.sales_orders
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles
    WHERE phone IN (
      SELECT driver_phone FROM public.shipments
      WHERE shipments.order_id = sales_orders.id
    )
  )
);

CREATE POLICY "drivers_read_customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT customer_id FROM public.sales_orders
    WHERE id IN (
      SELECT order_id FROM public.shipments
      WHERE driver_phone IN (
        SELECT phone FROM public.profiles
        WHERE user_id = auth.uid()
      )
    )
  )
);