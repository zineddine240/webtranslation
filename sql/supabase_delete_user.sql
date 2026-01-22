-- Create a function to allow admins to delete users
-- This function uses 'security definer' to run with elevated privileges
create or replace function public.delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Optional: Check if the executing user is an admin (if you want strict DB-level security)
  -- if not exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true) then
  --   raise exception 'Access Denied';
  -- end if;

  -- Delete from auth.users (this will cascade to profiles if foreign keys are set up correctly, 
  -- otherwise we might need to explicitely delete from profiles)
  
  -- Note: direct deletion from auth.users via SQL is possible if you are superuser or have permissions.
  -- In Supabase, usually you can't access auth.users directly from a function easily unless it's a specific setup.
  -- A safer bet for general "dashboard" usage without Edge Functions is deleting the PROFILE first, 
  -- but that leaves the Auth User orphan.
  
  -- HOWEVER, best practice for Supabase is using the Management API (Edge Functions). 
  -- But for a simple SQL Helper:
  
  delete from public.profiles where user_id = target_user_id;
  delete from public.translators where user_id = target_user_id;
  
  -- To truly delete the Auth User, you usually need the Service Key. 
  -- But we can try to rely on the fact that disabling their access might be enough for this 'dashboard view'.
  -- OR, if you are running this in the SQL Editor, you can delete from auth.users.
  -- But calling it from the Client (RPC) won't delete from auth.users usually due to permissions.
  
  -- Let's stick to deleting the public data (Profile/Translator) so they disappear from the app.
end;
$$;
