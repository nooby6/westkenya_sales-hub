-- Step 1: Drop dependent functions first
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 2: Drop old enum and create new one
DROP TYPE IF EXISTS public.app_role_new CASCADE;
DROP TYPE public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('ceo', 'manager', 'supervisor', 'sales_rep', 'driver');

-- Step 3: Recreate user_roles table role column with new type
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS role_new;
ALTER TABLE public.user_roles ADD COLUMN role_temp public.app_role DEFAULT 'sales_rep';

-- Step 4: Update role_temp based on existing data pattern (all become sales_rep as starting point)
UPDATE public.user_roles SET role_temp = 'sales_rep';

-- Step 5: Complete the migration
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS role;
ALTER TABLE public.user_roles RENAME COLUMN role_temp TO role;
ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'sales_rep';

-- Step 6: Recreate has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 7: Create new role hierarchy functions
CREATE OR REPLACE FUNCTION public.is_ceo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'ceo'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('ceo', 'manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('ceo', 'manager', 'supervisor')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_sales_rep_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('ceo', 'manager', 'supervisor', 'sales_rep')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_driver(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'driver'
  )
$$;

-- Step 8: Update legacy helper functions to use new role names
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('ceo', 'manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_warehouse_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('ceo', 'manager', 'supervisor')
  )
$$;

-- Step 9: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sales_rep'::public.app_role);
  
  RETURN NEW;
END;
$$;

-- Step 10: Add RLS policy for drivers to view their shipments
CREATE POLICY "Drivers can view assigned shipments"
ON public.shipments FOR SELECT
USING (
  is_driver(auth.uid()) AND driver_phone IN (
    SELECT phone FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update their delivery status"
ON public.shipments FOR UPDATE
USING (
  is_driver(auth.uid()) AND driver_phone IN (
    SELECT phone FROM public.profiles WHERE user_id = auth.uid()
  )
);