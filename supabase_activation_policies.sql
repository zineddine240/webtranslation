-- 1. Create Policy for Admin Users (General)
CREATE POLICY "Enable ALL actions for Admins"
ON public.activation_codes
FOR ALL
USING (
  (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

-- 2. Create Explicit Policy for your specific Email (Hard Override)
CREATE POLICY "Enable ALL for Super Admin"
ON public.activation_codes
FOR ALL
USING (
  auth.email() = 'achourzineddine16@gmail.com'
)
WITH CHECK (
  auth.email() = 'achourzineddine16@gmail.com'
);

-- 3. Simple READ policy just to test (remove later if strict security needed)
-- This allows anyone logged in to see the table (helpful for debugging your 403)
-- But we limit it to just the admin logic above usually.
-- Let's try to verify if the previous policy failed because RLS was enabled but no policy matched.
