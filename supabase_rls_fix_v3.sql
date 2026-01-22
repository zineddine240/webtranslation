-- The error "permission denied for table users" happens because 
-- standard RLS policies cannot query `auth.users` directly for security.
-- We must check `public.profiles` instead, or use a workaround.

-- Drop the failing policy first
DROP POLICY IF EXISTS "Enable ALL for Super Admin" ON public.activation_codes;

-- Create a corrected policy that checks YOUR UUID (User ID) directly
-- Replace 'YOUR_USER_ID_HERE' with your actual User ID if you know it, 
-- but better: we just assume if you can log in, we check your profile table which is safe.

CREATE POLICY "Super Admin Access via Profile"
ON public.activation_codes
FOR ALL
USING (
  -- Check if the current user's email inside PROFILES table matches yours
  exists (
    select 1 from public.profiles 
    where user_id = auth.uid() 
    and (email = 'achourzineddine16@gmail.com' OR is_admin = true)
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles 
    where user_id = auth.uid() 
    and (email = 'achourzineddine16@gmail.com' OR is_admin = true)
  )
);
