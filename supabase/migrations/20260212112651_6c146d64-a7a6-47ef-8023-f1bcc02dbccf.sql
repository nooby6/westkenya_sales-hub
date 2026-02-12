-- Allow drivers to read sales_orders for their assigned shipments
CREATE POLICY "Drivers can read sales orders for their shipments"
ON public.sales_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shipments
    WHERE shipments.order_id = sales_orders.id
    AND shipments.driver_phone = (
      SELECT phone FROM public.profiles
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow drivers to read customers for orders in their shipments
CREATE POLICY "Drivers can read customers for their delivery orders"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sales_orders
    WHERE sales_orders.customer_id = customers.id
    AND EXISTS (
      SELECT 1 FROM public.shipments
      WHERE shipments.order_id = sales_orders.id
      AND shipments.driver_phone = (
        SELECT phone FROM public.profiles
        WHERE user_id = auth.uid()
      )
    )
  )
);