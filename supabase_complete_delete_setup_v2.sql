-- 1. Fix Foreign Keys for PROFILES and TRANSLATORS (Known tables)
-- Profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Translators
ALTER TABLE public.translators DROP CONSTRAINT IF EXISTS translators_user_id_fkey;
ALTER TABLE public.translators ADD CONSTRAINT translators_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- 2. Create the Admin Delete Function
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
  -- Thanks to the Cascades above, this automatically deletes from profiles and translators.
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
