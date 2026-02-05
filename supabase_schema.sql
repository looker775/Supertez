=== CORRECTED COMPLETE SCHEMA ===
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS ride_offers, driver_subscriptions, rides, app_settings, profiles CASCADE;

-- PROFILES TABLE
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  role text CHECK (role IN ('owner', 'admin', 'driver', 'client')) DEFAULT 'client',
  full_name text,
  phone text,
  country text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- APP SETTINGS TABLE
CREATE TABLE app_settings (
  id int PRIMARY KEY DEFAULT 1,
  pricing_mode text CHECK (pricing_mode IN ('fixed', 'distance')) DEFAULT 'distance',
  fixed_price_amount numeric DEFAULT 100,
  price_per_km numeric DEFAULT 10,
  currency text DEFAULT 'USD',
  admins_can_edit_pricing boolean DEFAULT true,
  require_driver_subscription boolean DEFAULT true,
  driver_subscription_price numeric DEFAULT 2,
  subscription_days_free integer DEFAULT 0,
  client_payment_method text DEFAULT 'cash'
);

-- Insert default settings
INSERT INTO app_settings (id, pricing_mode, fixed_price_amount, price_per_km, currency, require_driver_subscription, driver_subscription_price, subscription_days_free, client_payment_method)
VALUES (1, 'distance', 50, 2, 'USD', true, 2, 0, 'cash')
ON CONFLICT (id) DO NOTHING;

-- RIDES TABLE
CREATE TABLE rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES profiles(id),
  driver_id uuid REFERENCES profiles(id),
  pickup_lat float NOT NULL,
  pickup_lng float NOT NULL,
  pickup_address text,
  drop_lat float NOT NULL,
  drop_lng float NOT NULL,
  drop_address text,
  city text, -- ADDED: for filtering rides by location
  passengers int DEFAULT 1,
  price numeric,
  status text CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RIDE OFFERS TABLE (CRITICAL - FOR DRIVER BIDDING SYSTEM)
CREATE TABLE ride_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  driver_lat float,
  driver_lng float,
  driver_name text,
  price_offer numeric,
  status text DEFAULT 'pending', -- pending, accepted, rejected
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(ride_id, driver_id)
);

-- DRIVER SUBSCRIPTIONS TABLE
CREATE TABLE driver_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES profiles(id),
  expires_at timestamp WITH time zone,
  is_free_access boolean DEFAULT false,
  free_access_days_remaining integer DEFAULT 0,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS POLICIES FOR APP SETTINGS
CREATE POLICY "Read settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Owners/Admins update settings" ON app_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- RLS POLICIES FOR RIDES
CREATE POLICY "Clients can see own rides" ON rides FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Drivers can see pending rides in their city" ON rides FOR SELECT USING (
  (status = 'pending' AND city IS NOT NULL) OR driver_id = auth.uid()
);
CREATE POLICY "Admins/Owners see all rides" ON rides FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "Clients can create rides" ON rides FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Drivers can update rides" ON rides FOR UPDATE USING (
  driver_id = auth.uid() OR (status = 'pending' AND driver_id IS NULL)
);

-- RLS POLICIES FOR RIDE OFFERS
CREATE POLICY "Clients can see offers for their rides" ON ride_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_offers.ride_id 
      AND rides.client_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can manage their own offers" ON ride_offers
  FOR ALL USING (auth.uid() = driver_id);

-- RLS POLICIES FOR DRIVER SUBSCRIPTIONS
CREATE POLICY "Drivers can view own subscription" ON driver_subscriptions 
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins manage subscriptions" ON driver_subscriptions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
CREATE POLICY "Drivers create sub" ON driver_subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- FUNCTION TO HANDLE NEW USER SIGNUP
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

-- TRIGGER FOR NEW USER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_rides_city_status ON rides(city, status);
CREATE INDEX idx_rides_client_id ON rides(client_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_ride_offers_ride_id ON ride_offers(ride_id);
CREATE INDEX idx_ride_offers_driver_id ON ride_offers(driver_id);


=== END OF SCHEMA ===