-- Create a table for user profiles if it doesn't exist
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  display_name text,
  avatar_url text,
  profession text,
  preferred_language text
);

-- Set up RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = user_id );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = user_id );
