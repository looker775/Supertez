-- ============================================
-- SUPERTEZ FINAL DATABASE SCHEMA
-- Complete working schema with all tables, RLS policies, and functions
-- ============================================

-- Drop existing objects to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS ride_offers, driver_subscriptions, rides, app_settings, profiles CASCADE;

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('owner', 'admin', 'driver', 'client')) DEFAULT 'client',
  full_name text,
  phone text,
  country text DEFAULT 'Kazakhstan',
  city text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 2. APP SETTINGS TABLE
-- ============================================
CREATE TABLE app_settings (
  id int PRIMARY KEY DEFAULT 1,
  -- Pricing Settings
  pricing_mode text CHECK (pricing_mode IN ('fixed', 'distance')) DEFAULT 'distance',
  fixed_price_amount numeric DEFAULT 100,
  price_per_km numeric DEFAULT 10,
  currency text DEFAULT 'USD',
  
  -- Driver Subscription Settings
  require_driver_subscription boolean DEFAULT true,
  driver_subscription_price numeric DEFAULT 2,
  subscription_currency text DEFAULT 'USD',
  subscription_period_days integer DEFAULT 30,
  
  -- Free Access Settings
  enable_free_driver_access boolean DEFAULT false,
  default_free_days integer DEFAULT 0,
  
  -- Payment Settings
  paypal_client_id text,
  paypal_secret text,
  payment_gateway text DEFAULT 'paypal',
  
  -- Security Settings (for future 2FA implementation)
  require_email_2fa boolean DEFAULT false,
  require_sms_2fa boolean DEFAULT false,
  require_face_id boolean DEFAULT false,
  require_fingerprint boolean DEFAULT false,
  
  -- App Settings
  app_name text DEFAULT 'Supertez',
  support_email text DEFAULT 'support@supertez.com',
  
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO app_settings (
  id, pricing_mode, fixed_price_amount, price_per_km, currency,
  require_driver_subscription, driver_subscription_price, subscription_period_days,
  enable_free_driver_access, default_free_days
) VALUES (
  1, 'distance', 50, 2, 'USD',
  true, 2, 30,
  true, 7
) ON CONFLICT DO NOTHING;

-- ============================================
-- 3. RIDES TABLE
-- ============================================
CREATE TABLE rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Location Data
  pickup_lat float NOT NULL,
  pickup_lng float NOT NULL,
  pickup_address text NOT NULL,
  pickup_city text,
  
  drop_lat float NOT NULL,
  drop_lng float NOT NULL,
  drop_address text NOT NULL,
  drop_city text,
  
  -- Ride Details
  distance_km numeric,
  estimated_time_minutes integer,
  passengers integer DEFAULT 1 CHECK (passengers > 0 AND passengers <= 20),
  
  -- Pricing
  base_price numeric,
  final_price numeric,
  currency text DEFAULT 'USD',
  
  -- Status
  status text CHECK (status IN ('pending', 'driver_assigned', 'driver_arrived', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method text DEFAULT 'cash',
  
  -- Timestamps
  accepted_at timestamp WITH time zone,
  started_at timestamp WITH time zone,
  completed_at timestamp WITH time zone,
  cancelled_at timestamp WITH time zone,
  cancellation_reason text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- 4. RIDE OFFERS TABLE (Driver Bidding)
-- ============================================
CREATE TABLE ride_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Driver Location at time of offer
  driver_lat float,
  driver_lng float,
  driver_name text NOT NULL,
  driver_phone text,
  driver_rating numeric,
  
  -- Offer Details
  price_offer numeric,
  estimated_arrival_minutes integer,
  message text,
  
  -- Status: pending, accepted, rejected, expired
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamp WITH time zone,
  
  UNIQUE(ride_id, driver_id)
);

-- ============================================
-- 5. DRIVER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE driver_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Subscription Details
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'free')),
  started_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp WITH time zone,
  
  -- Free Access
  is_free_access boolean DEFAULT false,
  free_days_granted integer DEFAULT 0,
  free_access_reason text,
  
  -- Payment
  last_payment_amount numeric,
  last_payment_date timestamp WITH time zone,
  payment_method text,
  paypal_subscription_id text,
  
  -- Auto-renewal
  auto_renew boolean DEFAULT true,
  
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(driver_id)
);

-- ============================================
-- 6. ADMIN ACTIVITY LOG
-- ============================================
CREATE TABLE admin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR PROFILES
-- ============================================
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" 
  ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- RLS POLICIES FOR APP SETTINGS
-- ============================================
CREATE POLICY "Anyone can read settings" 
  ON app_settings FOR SELECT USING (true);

CREATE POLICY "Only owner can update settings" 
  ON app_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owner can insert settings" 
  ON app_settings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- ============================================
-- RLS POLICIES FOR RIDES
-- ============================================
-- Clients can see their own rides
CREATE POLICY "Clients can see own rides" 
  ON rides FOR SELECT USING (auth.uid() = client_id);

-- Drivers can see pending rides in their city OR rides assigned to them
CREATE POLICY "Drivers can see available rides" 
  ON rides FOR SELECT USING (
    (status = 'pending' AND pickup_city IS NOT NULL) 
    OR driver_id = auth.uid()
  );

-- Admins can see all rides
CREATE POLICY "Admins see all rides" 
  ON rides FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Clients can create rides
CREATE POLICY "Clients can create rides" 
  ON rides FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Drivers can update rides (accept, complete, etc.)
CREATE POLICY "Drivers can update rides" 
  ON rides FOR UPDATE USING (
    driver_id = auth.uid() 
    OR (status = 'pending' AND driver_id IS NULL)
  );

-- Clients can update their own rides
CREATE POLICY "Clients can update own rides"
  ON rides FOR UPDATE USING (auth.uid() = client_id);

-- Admins can update any ride
CREATE POLICY "Admins can update any ride" 
  ON rides FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- RLS POLICIES FOR RIDE OFFERS
-- ============================================
-- Clients can see offers for their rides
CREATE POLICY "Clients can see offers for their rides" 
  ON ride_offers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_offers.ride_id 
      AND rides.client_id = auth.uid()
    )
  );

-- Drivers can manage their own offers
CREATE POLICY "Drivers can create offers" 
  ON ride_offers FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their offers"
  ON ride_offers FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their offers"
  ON ride_offers FOR UPDATE USING (auth.uid() = driver_id);

-- ============================================
-- RLS POLICIES FOR DRIVER SUBSCRIPTIONS
-- ============================================
-- Drivers can view own subscription
CREATE POLICY "Drivers can view own subscription" 
  ON driver_subscriptions FOR SELECT USING (auth.uid() = driver_id);

-- Drivers can create their own subscription
CREATE POLICY "Drivers can create own subscription" 
  ON driver_subscriptions FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Drivers can update their own subscription
CREATE POLICY "Drivers can update own subscription"
  ON driver_subscriptions FOR UPDATE USING (auth.uid() = driver_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins manage all subscriptions" 
  ON driver_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================
-- RLS POLICIES FOR ADMIN LOGS
-- ============================================
CREATE POLICY "Only admins can view logs" 
  ON admin_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Anyone can create logs" 
  ON admin_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  -- Determine role: owner for kaliwill3@gmail.com, otherwise from metadata
  IF new.email = 'kaliwill3@gmail.com' THEN
    user_role := 'owner';
  ELSE
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role, phone, city)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    user_role,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'city', '')
  );
  
  -- If user is a driver, create initial subscription record (free trial if enabled)
  IF user_role = 'driver' THEN
    DECLARE
      free_trial_enabled boolean;
      trial_days integer;
      expiry_date timestamp with time zone;
    BEGIN
      -- Check if free trial is enabled
      SELECT enable_free_driver_access, default_free_days 
      INTO free_trial_enabled, trial_days
      FROM app_settings WHERE id = 1;
      
      IF free_trial_enabled AND trial_days > 0 THEN
        expiry_date := timezone('utc'::text, now()) + (trial_days || ' days')::interval;
        
        INSERT INTO public.driver_subscriptions (
          driver_id, 
          status, 
          is_free_access, 
          free_days_granted,
          free_access_reason,
          expires_at
        ) VALUES (
          new.id, 
          'free', 
          true, 
          trial_days,
          'New driver registration trial',
          expiry_date
        );
      ELSE
        -- Create expired subscription (driver must subscribe)
        INSERT INTO public.driver_subscriptions (
          driver_id, 
          status, 
          is_free_access
        ) VALUES (
          new.id, 
          'expired', 
          false
        );
      END IF;
    END;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_subscriptions_updated_at BEFORE UPDATE ON driver_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check driver subscription status
CREATE OR REPLACE FUNCTION check_driver_subscription(driver_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM driver_subscriptions
    WHERE driver_id = driver_uuid
    AND (status = 'active' OR status = 'free')
    AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_pickup_city ON rides(pickup_city);
CREATE INDEX idx_rides_client_id ON rides(client_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_created_at ON rides(created_at DESC);
CREATE INDEX idx_ride_offers_ride_id ON ride_offers(ride_id);
CREATE INDEX idx_ride_offers_driver_id ON ride_offers(driver_id);
CREATE INDEX idx_ride_offers_status ON ride_offers(status);
CREATE INDEX idx_driver_subscriptions_driver_id ON driver_subscriptions(driver_id);
CREATE INDEX idx_driver_subscriptions_status ON driver_subscriptions(status);
CREATE INDEX idx_driver_subscriptions_expires ON driver_subscriptions(expires_at);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- ============================================
-- ENABLE REALTIME (CRITICAL FOR NOTIFICATIONS!)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE ride_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_subscriptions;

-- ============================================
-- COMPLETED
-- ============================================