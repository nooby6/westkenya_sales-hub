-- Drop problematic recursive policies
DROP POLICY IF EXISTS "drivers_read_sales_orders" ON public.sales_orders;
DROP POLICY IF EXISTS "drivers_read_customers" ON public.customers;

-- Disable RLS on these tables since drivers need to read all related data
ALTER TABLE public.sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;