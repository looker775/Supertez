-- 1. Update settings table with new permission toggle
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS admins_can_manage_drivers boolean DEFAULT true;

-- 2. Update the sync function to ensure your email is ALWAYS owner
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    CASE 
      WHEN new.email = 'kaliwill3@gmail.com' THEN 'owner'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'client')
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
