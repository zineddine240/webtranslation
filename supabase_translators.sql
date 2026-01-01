-- Create a table for translators
create table public.translators (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null, -- Links to the registered user
  full_name text not null,
  wilaya text not null,
  phone text,
  email text,
  specialties text[] default '{}', -- Array of specialties e.g. ['Juridique', 'Technique']
  languages text[] default '{}', -- Array of languages e.g. ['Arabe', 'Français']
  verified boolean default false, -- Only admin can verify
  bio text,
  image_url text
);

-- Set up Row Level Security (RLS)
alter table public.translators enable row level security;

-- Policy: Everyone can view translators
create policy "Public profiles are viewable by everyone."
  on public.translators for select
  using ( true );

-- Policy: Users can insert their own translator profile
create policy "Users can insert their own profile."
  on public.translators for insert
  with check ( auth.uid() = user_id );

-- Policy: Users can update their own profile
create policy "Users can update own profile."
  on public.translators for update
  using ( auth.uid() = user_id );
