-- RIDE MESSAGES TABLE (CHAT)
CREATE TABLE IF NOT EXISTS ride_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role text CHECK (sender_role IN ('client', 'driver')),
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id_created_at
  ON ride_messages(ride_id, created_at);

ALTER TABLE ride_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants can read messages" ON ride_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_messages.ride_id
      AND (r.client_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

CREATE POLICY "Ride participants can send messages" ON ride_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_messages.ride_id
      AND (r.client_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );
