-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'warehouse_staff', 'sales_rep');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled');

-- Create shipment status enum
CREATE TYPE public.shipment_status AS ENUM ('pending', 'loading', 'in_transit', 'delivered');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'sales_rep',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create depots table
CREATE TABLE public.depots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit_of_measure TEXT NOT NULL DEFAULT 'kg',
  min_stock_level INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  assigned_sales_rep_id UUID REFERENCES auth.users(id),
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create inventory table (stock levels per depot per product)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id UUID REFERENCES public.depots(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (depot_id, product_id)
);

-- Create sales_orders table
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  depot_id UUID REFERENCES public.depots(id) NOT NULL,
  sales_rep_id UUID REFERENCES auth.users(id) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.sales_orders(id) NOT NULL,
  driver_name TEXT NOT NULL,
  driver_id_number TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  vehicle_number_plate TEXT NOT NULL,
  driver_photo_url TEXT,
  status shipment_status NOT NULL DEFAULT 'pending',
  dispatched_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create inventory_transactions table for tracking stock movements
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.sales_orders(id),
  transaction_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Create function to check if user is warehouse staff or higher
CREATE OR REPLACE FUNCTION public.is_warehouse_or_higher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'warehouse_staff')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_or_manager(auth.uid()));

-- User roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin_or_manager(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Depots policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view depots" ON public.depots
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Admins can manage depots" ON public.depots
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- Products policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- Customers policies
CREATE POLICY "Sales reps can view assigned customers" ON public.customers
  FOR SELECT TO authenticated USING (
    assigned_sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Sales reps can manage assigned customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (
    assigned_sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Sales reps can update assigned customers" ON public.customers
  FOR UPDATE TO authenticated USING (
    assigned_sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE USING (public.is_admin_or_manager(auth.uid()));

-- Inventory policies
CREATE POLICY "Authenticated users can view inventory" ON public.inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Warehouse staff can manage inventory" ON public.inventory
  FOR INSERT TO authenticated WITH CHECK (public.is_warehouse_or_higher(auth.uid()));

CREATE POLICY "Warehouse staff can update inventory" ON public.inventory
  FOR UPDATE TO authenticated USING (public.is_warehouse_or_higher(auth.uid()));

-- Sales orders policies
CREATE POLICY "Users can view their orders or all if admin" ON public.sales_orders
  FOR SELECT TO authenticated USING (
    sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid())
  );

CREATE POLICY "Sales reps can create orders" ON public.sales_orders
  FOR INSERT TO authenticated WITH CHECK (sales_rep_id = auth.uid());

CREATE POLICY "Users can update orders" ON public.sales_orders
  FOR UPDATE TO authenticated USING (
    sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid())
  );

-- Order items policies
CREATE POLICY "Users can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.sales_orders 
      WHERE sales_orders.id = order_items.order_id 
      AND (sales_orders.sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

CREATE POLICY "Users can manage order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_orders 
      WHERE sales_orders.id = order_items.order_id 
      AND (sales_orders.sales_rep_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    )
  );

-- Shipments policies
CREATE POLICY "Authenticated users can view shipments" ON public.shipments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Warehouse staff can create shipments" ON public.shipments
  FOR INSERT TO authenticated WITH CHECK (public.is_warehouse_or_higher(auth.uid()));

CREATE POLICY "Warehouse staff can update shipments" ON public.shipments
  FOR UPDATE TO authenticated USING (public.is_warehouse_or_higher(auth.uid()));

-- Inventory transactions policies
CREATE POLICY "Authenticated users can view transactions" ON public.inventory_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Warehouse staff can create transactions" ON public.inventory_transactions
  FOR INSERT TO authenticated WITH CHECK (public.is_warehouse_or_higher(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_depots_updated_at BEFORE UPDATE ON public.depots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), NEW.email);
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sales_rep');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for depots
INSERT INTO public.depots (name, location, contact_phone) VALUES
  ('Kabras Main Depot', 'Kakamega, Kenya', '+254 700 123 456'),
  ('Nairobi Distribution Center', 'Nairobi, Kenya', '+254 700 234 567'),
  ('Mombasa Depot', 'Mombasa, Kenya', '+254 700 345 678');

-- Insert sample products
INSERT INTO public.products (name, sku, description, unit_price, unit_of_measure, min_stock_level) VALUES
  ('Kabras White Sugar 1kg', 'KWS-001', 'Premium white sugar 1kg pack', 150.00, 'kg', 500),
  ('Kabras White Sugar 2kg', 'KWS-002', 'Premium white sugar 2kg pack', 290.00, 'kg', 300),
  ('Kabras White Sugar 5kg', 'KWS-005', 'Premium white sugar 5kg pack', 700.00, 'kg', 200),
  ('Kabras White Sugar 25kg', 'KWS-025', 'Bulk white sugar 25kg bag', 3400.00, 'kg', 100),
  ('Kabras White Sugar 50kg', 'KWS-050', 'Industrial white sugar 50kg bag', 6700.00, 'kg', 50),
  ('Kabras Brown Sugar 1kg', 'KBS-001', 'Premium brown sugar 1kg pack', 180.00, 'kg', 300),
  ('Kabras Brown Sugar 2kg', 'KBS-002', 'Premium brown sugar 2kg pack', 350.00, 'kg', 200);

-- Insert sample inventory (using a subquery for depot/product IDs)
INSERT INTO public.inventory (depot_id, product_id, quantity)
SELECT d.id, p.id, 
  CASE 
    WHEN d.name = 'Kabras Main Depot' THEN 10000
    WHEN d.name = 'Nairobi Distribution Center' THEN 5000
    ELSE 3000
  END
FROM public.depots d
CROSS JOIN public.products p;