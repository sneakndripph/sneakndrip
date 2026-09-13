-- Fixes handle_new_user() so signing up with an email that already has a
-- customers row (e.g. from a prior guest checkout) links that row to the
-- new auth account instead of silently no-op'ing and leaving auth_user_id
-- NULL forever. Also backfills any rows already orphaned by the old
-- behavior. Idempotent: safe to re-run.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (auth_user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = excluded.auth_user_id
    WHERE customers.auth_user_id IS NULL;
  RETURN NEW;
END;
$$;

-- One-shot backfill: heal existing customers rows that were orphaned by the
-- old DO NOTHING behavior, where a matching auth.users row already exists.
-- Only ever fills a NULL -- never overwrites an existing link.
UPDATE public.customers c
SET auth_user_id = u.id
FROM auth.users u
WHERE c.auth_user_id IS NULL
  AND u.email = c.email;
