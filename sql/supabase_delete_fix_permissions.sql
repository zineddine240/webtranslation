-- Update the delete function to explicitly allow your email
-- This fixes the issue where the database might not see you as "Admin" yet
CREATE OR REPLACE FUNCTION public.delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict Check: Allow if is_admin is true OR if it's YOU specifically
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (is_admin = true OR email = 'achourzineddine16@gmail.com')
  ) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to delete users.';
  END IF;

  -- Delete from Auth.Users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
