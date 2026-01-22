-- 1. Fix Foreign Keys for ALL tables to allow Deletion (Cascade)
-- This prevents the "500 Error" by ensuring related data is deleted first.

-- Profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Translators
ALTER TABLE public.translators DROP CONSTRAINT IF EXISTS translators_user_id_fkey;
ALTER TABLE public.translators ADD CONSTRAINT translators_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Translations (Important! This is often the hidden blocker)
ALTER TABLE public.translations DROP CONSTRAINT IF EXISTS translations_user_id_fkey;
ALTER TABLE public.translations ADD CONSTRAINT translations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- 2. Create the Admin Delete Function
-- This function runs with "Super" privileges (Security Definer) so it can delete from Auth.Users
CREATE OR REPLACE FUNCTION public.delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict Check: Only allow if the person calling this is an Admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to delete users.';
  END IF;

  -- Delete from Auth.Users
  -- Thanks to the Cascades above, this automatically deletes from profiles, translators, etc.
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
