-- Fix: Sensitive Driver Information Exposed to All Users
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view shipments" ON public.shipments;

-- Create role-based access policies for shipments
-- Warehouse staff and admins can view all shipments
CREATE POLICY "Warehouse and admin can view all shipments" 
ON public.shipments 
FOR SELECT 
TO authenticated 
USING (is_warehouse_or_higher(auth.uid()));

-- Sales reps can only view shipments for their own orders
CREATE POLICY "Sales reps can view their order shipments" 
ON public.shipments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.sales_orders
    WHERE sales_orders.id = shipments.order_id
    AND sales_orders.sales_rep_id = auth.uid()
  )
);