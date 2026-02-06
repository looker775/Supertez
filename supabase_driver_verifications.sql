-- Driver verification workflow

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_blocked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.driver_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
  id_document_type text CHECK (id_document_type IN ('passport', 'id_card')) NOT NULL,
  id_document_number text,
  id_document_front_path text NOT NULL,
  id_document_back_path text,
  license_number text NOT NULL,
  license_class text NOT NULL,
  license_photo_path text NOT NULL,
  plate_number text NOT NULL,
  admin_note text,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_driver_verifications_status ON public.driver_verifications(status);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_driver_id ON public.driver_verifications(driver_id);

ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers manage own verification" ON public.driver_verifications;
DROP POLICY IF EXISTS "Admins manage driver verifications" ON public.driver_verifications;

CREATE POLICY "Drivers manage own verification" ON public.driver_verifications
  FOR ALL USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins manage driver verifications" ON public.driver_verifications
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

-- Storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-docs', 'driver-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (bucket: driver-docs)
DROP POLICY IF EXISTS "Drivers upload own docs" ON storage.objects;
DROP POLICY IF EXISTS "Drivers read own docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins read driver docs" ON storage.objects;

CREATE POLICY "Drivers upload own docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers read own docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read driver docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-docs'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
    )
  );
