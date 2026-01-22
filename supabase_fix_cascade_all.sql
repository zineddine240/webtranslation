-- 1. Fix Foreign Key on TRANSLATIONS (This was likely missing!)
ALTER TABLE public.translations
DROP CONSTRAINT IF EXISTS translations_user_id_fkey;

ALTER TABLE public.translations
ADD CONSTRAINT translations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- 2. Re-apply Profiles just in case
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- 3. Re-apply Translators just in case
ALTER TABLE public.translators
DROP CONSTRAINT IF EXISTS translators_user_id_fkey;

ALTER TABLE public.translators
ADD CONSTRAINT translators_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;
