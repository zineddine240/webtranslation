-- 1. Fix Foreign Key on profiles to allow Cascade Delete
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- 2. Fix Foreign Key on translators too
ALTER TABLE public.translators
DROP CONSTRAINT IF EXISTS translators_user_id_fkey;

ALTER TABLE public.translators
ADD CONSTRAINT translators_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- 3. (Optional) Fix storage objects if you are using them
-- This ensures deleting a user also deletes their uploaded images
-- (Requires specific handling usually, but this is a good start)
