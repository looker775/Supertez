-- DRIVER LOCATION TRACKING COLUMNS
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS driver_lat double precision,
  ADD COLUMN IF NOT EXISTS driver_lng double precision,
  ADD COLUMN IF NOT EXISTS driver_updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS driver_speed_kmh double precision,
  ADD COLUMN IF NOT EXISTS driver_heading double precision;
