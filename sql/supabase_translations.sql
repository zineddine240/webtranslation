-- Create the translations table for history tracking
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Policies for security
CREATE POLICY "Users can view their own translations"
  ON public.translations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translations"
  ON public.translations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own translations"
  ON public.translations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can clear their own translations"
  ON public.translations FOR DELETE
  USING (auth.uid() = user_id);

-- Permissions
GRANT ALL ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;
