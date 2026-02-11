-- Enable driver offer pricing by country

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS driver_offer_countries text[] DEFAULT '{}';

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS allow_driver_offers boolean DEFAULT false;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS client_offer_price numeric;

-- Expand ride_offers to support negotiation
ALTER TABLE public.ride_offers
  ADD COLUMN IF NOT EXISTS price_offer numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS client_counter_price numeric,
  ADD COLUMN IF NOT EXISTS client_countered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_id ON public.ride_offers(ride_id);

-- Allow clients to counter offers for their rides
DROP POLICY IF EXISTS "Clients can update offers for their rides" ON public.ride_offers;
CREATE POLICY "Clients can update offers for their rides" ON public.ride_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_offers.ride_id
      AND r.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_offers.ride_id
      AND r.client_id = auth.uid()
    )
  );

-- Allow clients to update their own rides (for offer price / cancellation)
DROP POLICY IF EXISTS "Clients can update own rides" ON public.rides;
CREATE POLICY "Clients can update own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);
