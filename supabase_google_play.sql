-- Google Play subscription sync support for driver subscriptions

ALTER TABLE public.driver_subscriptions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_product_id text,
  ADD COLUMN IF NOT EXISTS provider_purchase_token text,
  ADD COLUMN IF NOT EXISTS provider_subscription_id text,
  ADD COLUMN IF NOT EXISTS last_payment_amount numeric,
  ADD COLUMN IF NOT EXISTS last_payment_currency text,
  ADD COLUMN IF NOT EXISTS last_payment_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_driver_subscriptions_provider
  ON public.driver_subscriptions(provider);
