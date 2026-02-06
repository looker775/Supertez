-- Admin approval + permissions
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_blocked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_can_edit_pricing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_can_manage_subscriptions boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_can_grant_free_access boolean DEFAULT false;

-- Allow owner to update admin profiles (approve/block/permissions)
DROP POLICY IF EXISTS "Owner can update admins" ON profiles;
CREATE POLICY "Owner can update admins" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'owner'
    )
    AND role = 'admin'
  )
  WITH CHECK (role = 'admin');

-- Tighten app_settings update permissions
DROP POLICY IF EXISTS "Owners/Admins update settings" ON app_settings;
CREATE POLICY "Owners/Admins update settings" ON app_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role = 'owner'
        OR (
          p.role = 'admin'
          AND p.admin_approved = true
          AND p.admin_blocked = false
          AND (p.admin_can_edit_pricing = true OR p.admin_can_manage_subscriptions = true)
        )
      )
    )
  );

-- Update driver_subscriptions access for admins
DROP POLICY IF EXISTS "Admins manage subscriptions" ON driver_subscriptions;
DROP POLICY IF EXISTS "Owners manage subscriptions" ON driver_subscriptions;
DROP POLICY IF EXISTS "Admins can view subscriptions" ON driver_subscriptions;

CREATE POLICY "Owners manage subscriptions" ON driver_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'owner'
    )
  );

CREATE POLICY "Admins manage subscriptions" ON driver_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.admin_approved = true
      AND p.admin_blocked = false
      AND p.admin_can_grant_free_access = true
    )
  );

CREATE POLICY "Admins can view subscriptions" ON driver_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role = 'owner'
        OR (
          p.role = 'admin'
          AND p.admin_approved = true
          AND p.admin_blocked = false
        )
      )
    )
  );
