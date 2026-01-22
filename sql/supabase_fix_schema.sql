-- DANGER: This drops the existing table and data. Ensure you want to reset.
drop table if exists public.translators;

-- Re-create the table with ALL required columns
create table public.translators (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null, -- Links to the registered user
  
  -- Personal Info
  first_name text not null,
  last_name text not null,
  phone text,
  email text, -- Contact email for clients
  
  -- Professional Info
  wilaya text not null,
  office_address text,
  accreditation_number text, -- This was missing before
  
  -- Skills
  specialties text[] default '{}', -- Used for Language Pairs now
  languages text[] default '{}',
  
  -- Status
  verified boolean default false, -- Only admin can verify
  bio text,
  image_url text
);

-- Set up Row Level Security (RLS)
alter table public.translators enable row level security;

-- Policy: Everyone can view translators (Public Directory)
create policy "Public profiles are viewable by everyone."
  on public.translators for select
  using ( true );

-- Policy: Users can insert their own translator profile
create policy "Users can check own profile."
  on public.translators for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert their own translator profile
create policy "Users can insert their own profile."
  on public.translators for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own profile
create policy "Users can update own profile."
  on public.translators for update
  using ( auth.uid() = user_id );

-- Grant permissions (if needed for some setups)
grant all on public.translators to authenticated;
grant all on public.translators to service_role;
