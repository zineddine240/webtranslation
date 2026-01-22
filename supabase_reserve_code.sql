-- 1. Add reserved_for_email column
ALTER TABLE public.activation_codes 
ADD COLUMN IF NOT EXISTS reserved_for_email text;

-- 2. Create RPC function to handle "Invalidate Old + Generate New" logic atomically
CREATE OR REPLACE FUNCTION public.generate_reserved_code(target_email text, duration_days_input integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code_val text;
  result_record record;
BEGIN
  -- 1. Invalidate any existing ACTIVE codes for this specific email
  UPDATE public.activation_codes
  SET status = 'expired'
  WHERE reserved_for_email = target_email 
  AND status = 'active';

  -- 2. Generate new random code
  -- Format: LXT-XXXX-XXXX (we'll generate it here or pass it in? easier to generate here to simplistic)
  -- Let's use a simple distinct generator or pass it from client? 
  -- Passing from client is easier for the random string logic, but let's do it here for "one-click" safety.
  -- Actually, let's let the CLIENT pass the random string to avoid complex SQL random logic, 
  -- BUT the atomic invalidation must happen here.
  
  -- Wait, I will just accept the code string from the client to keep it flexible.
  -- But to make it "Invalidate Old", the client needs to call this function.
  
  RETURN json_build_object('success', true, 'message', 'Ready to insert');
END;
$$;

-- Actually, a better approach is a complete function that takes the new code string and the email.
CREATE OR REPLACE FUNCTION public.generate_and_reserve_code(new_code_str text, target_email text, duration_days_input integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- 1. Invalidate old codes for this person
  UPDATE public.activation_codes
  SET status = 'expired'
  WHERE reserved_for_email = target_email 
  AND status = 'active';

  -- 2. Insert new code
  INSERT INTO public.activation_codes (code, duration_days, reserved_for_email, status)
  VALUES (new_code_str, duration_days_input, target_email, 'active')
  RETURNING id INTO new_id;

  RETURN json_build_object('success', true, 'id', new_id, 'code', new_code_str);
END;
$$;
