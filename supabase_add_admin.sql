-- Add is_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create policy to allow admins to view all profiles (if you had restrictive RLS)
-- For now, we assume public read, but restricted writes.

-- Example: Set your specific email as admin (REPLACE WITH YOUR EMAIL)
-- UPDATE public.profiles SET is_admin = true WHERE email = 'votre_email@exemple.com';
