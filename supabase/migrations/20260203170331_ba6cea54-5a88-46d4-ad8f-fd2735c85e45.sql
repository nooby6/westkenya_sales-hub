-- Update profiles RLS to allow managers to view and edit all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Managers and admins can view all profiles
CREATE POLICY "Admins and managers can view all profiles" 
ON public.profiles FOR SELECT 
USING (is_admin_or_manager(auth.uid()) OR auth.uid() = user_id);

-- Managers and admins can update all profiles
CREATE POLICY "Admins and managers can update all profiles" 
ON public.profiles FOR UPDATE 
USING (is_admin_or_manager(auth.uid()) OR auth.uid() = user_id);

-- Update user_roles RLS to allow managers to manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Managers and admins can view all roles
CREATE POLICY "Admins and managers can view all roles" 
ON public.user_roles FOR SELECT 
USING (is_admin_or_manager(auth.uid()) OR auth.uid() = user_id);

-- Managers and admins can insert roles
CREATE POLICY "Admins and managers can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (is_admin_or_manager(auth.uid()));

-- Managers and admins can update roles
CREATE POLICY "Admins and managers can update roles" 
ON public.user_roles FOR UPDATE 
USING (is_admin_or_manager(auth.uid()));

-- Managers and admins can delete roles (for role changes)
CREATE POLICY "Admins and managers can delete roles" 
ON public.user_roles FOR DELETE 
USING (is_admin_or_manager(auth.uid()));