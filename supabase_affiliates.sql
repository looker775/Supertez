-- Affiliate program support

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS affiliate_joined_at timestamp with time zone;

-- Extend role check to include affiliate
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'driver', 'client', 'affiliate'));

CREATE TABLE IF NOT EXISTS public.affiliate_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_codes_affiliate_id ON public.affiliate_codes(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON public.profiles(affiliate_code);

ALTER TABLE public.affiliate_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates read own code" ON public.affiliate_codes;
DROP POLICY IF EXISTS "Affiliates insert own code" ON public.affiliate_codes;
DROP POLICY IF EXISTS "Admins manage affiliate codes" ON public.affiliate_codes;

CREATE POLICY "Affiliates read own code" ON public.affiliate_codes
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Affiliates insert own code" ON public.affiliate_codes
  FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

CREATE POLICY "Admins manage affiliate codes" ON public.affiliate_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
    )
  );
