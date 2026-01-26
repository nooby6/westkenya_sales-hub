-- Create sugar_types enum for categorization
CREATE TYPE public.sugar_type AS ENUM ('bale_2x10', 'bale_1x20', 'bale_1x12', 'bag_50kg', 'bag_25kg');

-- Add sugar_type column to products table
ALTER TABLE public.products ADD COLUMN sugar_type public.sugar_type;

-- Update existing products with default sugar type
UPDATE public.products SET sugar_type = 'bag_50kg' WHERE sugar_type IS NULL;

-- Create sales_returns table
CREATE TABLE public.sales_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.sales_orders(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  return_reason TEXT NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  notes TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_returns
CREATE POLICY "Authenticated users can view returns"
  ON public.sales_returns FOR SELECT
  USING (true);

CREATE POLICY "Warehouse staff can create returns"
  ON public.sales_returns FOR INSERT
  WITH CHECK (is_warehouse_or_higher(auth.uid()));

CREATE POLICY "Warehouse staff can update returns"
  ON public.sales_returns FOR UPDATE
  USING (is_warehouse_or_higher(auth.uid()));

CREATE POLICY "Admins can delete returns"
  ON public.sales_returns FOR DELETE
  USING (is_admin_or_manager(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_sales_returns_updated_at
  BEFORE UPDATE ON public.sales_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sales_returns
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_returns;