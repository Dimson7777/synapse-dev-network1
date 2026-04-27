-- Drop duplicate unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

-- Replace the trigger function with a more robust version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _username text;
  _display_name text;
  _avatar_url text;
  _attempt int := 0;
BEGIN
  _username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', 'Developer');
  _avatar_url := COALESCE(NEW.raw_user_meta_data->>'avatar_url', '');

  LOOP
    BEGIN
      INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
      VALUES (NEW.id, _username, _display_name, _avatar_url);
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      -- If username collision, append random suffix and retry (up to 5 times)
      _attempt := _attempt + 1;
      IF _attempt > 5 THEN
        RAISE EXCEPTION 'Could not create unique username after 5 attempts';
      END IF;
      _username := COALESCE(NEW.raw_user_meta_data->>'username', 'user') || '_' || substr(md5(random()::text), 1, 6);
    END;
  END LOOP;
END;
$$;