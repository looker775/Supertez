-- ============================================
-- FIX FOR ORDER DELIVERY ISSUE
-- ============================================
-- This SQL file fixes the issue where drivers don't receive orders when clients make them.
-- 
-- PROBLEMS IDENTIFIED:
-- 1. The 'ride_offers' table is missing - drivers can't send offers to clients
-- 2. The 'city' column is missing from 'rides' table - can't filter rides by city
-- 3. The 'driver_name' column is missing from 'ride_offers' table
--
-- Run this SQL in your Supabase SQL Editor to fix the issue.
-- ============================================

-- 1. Create the ride_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ride_offers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_lat float,
  driver_lng float,
  driver_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(ride_id, driver_id)
);

-- 2. Add city column to rides table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='rides' 
    AND column_name='city'
  ) THEN
    ALTER TABLE public.rides ADD COLUMN city text;
  END IF;
END $$;

-- 3. Add driver_name column to ride_offers if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='ride_offers' 
    AND column_name='driver_name'
  ) THEN
    ALTER TABLE public.ride_offers ADD COLUMN driver_name text;
  END IF;
END $$;

-- 4. Enable Row Level Security on ride_offers
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for ride_offers
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can see offers for their rides" ON public.ride_offers;
DROP POLICY IF EXISTS "Drivers can manage their own offers" ON public.ride_offers;

-- Create policies
CREATE POLICY "Clients can see offers for their rides" ON public.ride_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE rides.id = ride_offers.ride_id 
      AND rides.client_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can manage their own offers" ON public.ride_offers
  FOR ALL USING (auth.uid() = driver_id);

-- 6. Update rides RLS policy to ensure drivers can see pending rides
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Drivers can see pending rides" ON public.rides;

-- Create updated policy that allows drivers to see pending rides
CREATE POLICY "Drivers can see pending rides" ON public.rides
  FOR SELECT USING (status = 'pending' OR driver_id = auth.uid());

-- 7. Verify the setup
SELECT 
  'ride_offers table exists' as check_item,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_offers') as status
UNION ALL
SELECT 
  'city column exists in rides',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'city')
UNION ALL
SELECT 
  'driver_name column exists in ride_offers',
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_offers' AND column_name = 'driver_name');

-- ============================================
-- HOW THIS FIX WORKS:
-- ============================================
-- 
-- 1. When a client creates an order (ClientDashboard.tsx line 68-72):
--    - The ride is inserted with city: userCity
--    - The city column now exists, so this will work
--
-- 2. When drivers fetch rides (DriverDashboard.tsx line 38-47):
--    - They filter rides by city matching their location
--    - They only see rides with status = 'pending'
--    - The RLS policy allows this
--
-- 3. When a driver sends an offer (DriverDashboard.tsx line 50-58):
--    - The offer is inserted into ride_offers table
--    - Includes driver_name, driver_lat, driver_lng
--    - The table now exists with all required columns
--
-- 4. When client views offers (ClientDashboard.tsx line 49-51):
--    - They can see offers for their rides
--    - The RLS policy allows this
--
-- ============================================