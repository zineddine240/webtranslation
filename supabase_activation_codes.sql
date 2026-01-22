-- 1. Table for Activation Codes
create table if not exists public.activation_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  status text default 'active' check (status in ('active', 'used', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  used_by uuid references auth.users(id),
  used_at timestamp with time zone,
  duration_days integer default 30 -- Default 30 days
);

-- 2. Add subscription expiration to profiles (if not exists)
alter table public.profiles 
add column if not exists subscription_expires_at timestamp with time zone;

-- 3. RLS Policies for Activation Codes
alter table public.activation_codes enable row level security;

-- Admins can read/create everything
create policy "Admins can manage codes"
  on public.activation_codes
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Users can read a code ONLY if they are trying to activate it (we'll use a secure function instead for safety)
-- Actually, better to use a Secure RPC Function for activation to prevent snooping.

-- 4. Function to Activate a Code
create or replace function public.activate_sub_code(code_input text)
returns json
language plpgsql
security definer
as $$
declare
  found_code record;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  -- Find the code
  select * into found_code 
  from public.activation_codes 
  where code = code_input 
  and status = 'active'
  limit 1;

  if found_code is null then
    return json_build_object('success', false, 'message', 'Code invalide ou déjà utilisé.');
  end if;

  -- Update the Code to Used
  update public.activation_codes
  set status = 'used',
      used_by = current_user_id,
      used_at = now()
  where id = found_code.id;

  -- Update the User Profile Expiration
  update public.profiles
  set subscription_expires_at = (now() + (found_code.duration_days || ' days')::interval)
  where user_id = current_user_id;

  return json_build_object('success', true, 'message', 'Abonnement activé avec succès !');
end;
$$;
