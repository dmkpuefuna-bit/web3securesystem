/*
# Fix handle_new_user trigger function search_path

## Problem
The `handle_new_user()` trigger function was created as `SECURITY DEFINER` without
setting `search_path`. In Supabase, this causes "Database error saving new user"
because the function can't reliably resolve the `public.profiles` table when
executed in the auth context during user signup.

## Fix
Recreate the function with `SET search_path = public` so it always resolves
the profiles table correctly regardless of the calling context.

## Security
- No data is changed or lost.
- The function logic remains identical — only the search_path is added.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, email, role, status)
  VALUES (NEW.id, NEW.email, 'user', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
