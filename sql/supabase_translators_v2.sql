-- Create a table for translators with detailed profile info
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
  accreditation_number text, -- Private: For verification only
  
  -- Skills
  specialties text[] default '{}', 
  languages text[] default '{}',
  
  -- Status
  verified boolean default false, -- Only admin can verify
  bio text,
  image_url text
);

-- Set up Row Level Security (RLS)
alter table public.translators enable row level security;

-- Policy: Everyone can view translators (Public Directory)
-- Note: In a real prod app, use a View to hide 'accreditation_number' strictly.
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

-- Storage Bucket for Profile Pictures
insert into storage.buckets (id, name, public) 
values ('translator-images', 'translator-images', true);

create policy "Translator images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'translator-images' );

create policy "Translators can upload images."
  on storage.objects for insert
  with check ( bucket_id = 'translator-images' AND auth.role() = 'authenticated' );
