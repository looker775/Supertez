-- Support chat tables for client/driver <-> admin

CREATE TABLE IF NOT EXISTS public.support_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_role text CHECK (user_role IN ('client', 'driver')) NOT NULL,
  status text CHECK (status IN ('open', 'closed')) DEFAULT 'open' NOT NULL,
  subject text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_threads_user_id ON public.support_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_support_threads_status ON public.support_threads(status);
CREATE INDEX IF NOT EXISTS idx_support_threads_last_message_at ON public.support_threads(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES public.support_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_role text CHECK (sender_role IN ('client', 'driver', 'admin', 'owner')) NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread_id_created_at
  ON public.support_messages(thread_id, created_at);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own support threads" ON public.support_threads;
DROP POLICY IF EXISTS "Admins manage support threads" ON public.support_threads;

CREATE POLICY "Users manage own support threads" ON public.support_threads
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage support threads" ON public.support_threads
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

DROP POLICY IF EXISTS "Users read own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users send own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins manage support messages" ON public.support_messages;

CREATE POLICY "Users read own support messages" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users send own support messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage support messages" ON public.support_messages
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
