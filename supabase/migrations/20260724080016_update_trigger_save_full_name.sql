/*
# Update handle_new_user to save full_name from signup metadata

## Problem
The SignupPage passes `full_name` via `options.data` in `supabase.auth.signUp()`,
but the `handle_new_user()` trigger only inserts `user_id`, `email`, `role`, and `status` —
it ignores the `raw_user_meta_data` that contains the full name.

The frontend then tries to update the profile directly, but this fails under RLS
because the session may not be established yet.

## Fix
Update the trigger function to read `full_name` from `NEW.raw_user_meta_data`
and insert it into the profiles table. This eliminates the need for the frontend
to do a separate update call.

## Security
- No data is changed or lost.
- The function remains SECURITY DEFINER with search_path = public.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, email, role, status, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    'active',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'full_name')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
