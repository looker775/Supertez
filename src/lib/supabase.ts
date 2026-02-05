import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'driver' | 'client';
  full_name: string;
  phone?: string;
  country?: string;
  city?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  client_id: string;
  driver_id?: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  pickup_city?: string;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  drop_city?: string;
  distance_km?: number;
  estimated_time_minutes?: number;
  passengers: number;
  base_price?: number;
  final_price?: number;
  currency?: string;
  status: 'pending' | 'driver_assigned' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface RideOffer {
  id: string;
  ride_id: string;
  driver_id: string;
  driver_lat?: number;
  driver_lng?: number;
  driver_name: string;
  driver_phone?: string;
  driver_rating?: number;
  price_offer?: number;
  estimated_arrival_minutes?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at?: string;
}

export interface DriverSubscription {
  id: string;
  driver_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'free';
  started_at?: string;
  expires_at?: string;
  is_free_access: boolean;
  free_days_granted?: number;
  free_access_reason?: string;
  last_payment_amount?: number;
  last_payment_date?: string;
  payment_method?: string;
  paypal_subscription_id?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  pricing_mode: 'fixed' | 'distance';
  fixed_price_amount?: number;
  price_per_km?: number;
  currency: string;
  require_driver_subscription: boolean;
  driver_subscription_price?: number;
  subscription_currency?: string;
  subscription_period_days?: number;
  enable_free_driver_access: boolean;
  default_free_days?: number;
  paypal_client_id?: string;
  paypal_secret?: string;
  payment_gateway?: string;
  require_email_2fa: boolean;
  require_sms_2fa: boolean;
  require_face_id: boolean;
  require_fingerprint: boolean;
  app_name?: string;
  support_email?: string;
  updated_at: string;
}

// Helper functions
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const metadataPhone = typeof user.user_metadata?.phone === 'string'
    ? user.user_metadata.phone
    : null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
  }

  if (data) {
    if (!data.phone && metadataPhone) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: metadataPhone })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating phone:', updateError);
      } else {
        return { ...(data as Profile), phone: metadataPhone };
      }
    }

    return data as Profile;
  }

  const fallbackRole =
    user.email === 'kaliwill3@gmail.com'
      ? 'owner'
      : (user.user_metadata?.role as Profile['role'] | undefined) || 'client';
  const fullName = typeof user.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : null;

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        role: fallbackRole,
        full_name: fullName,
        phone: metadataPhone ?? undefined,
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    console.error('Error creating profile:', upsertError);
  }

  const { data: newProfile, error: newProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (newProfileError) {
    console.error('Error reloading profile:', newProfileError);
  }

  if (newProfile) return newProfile as Profile;

  return {
    id: user.id,
    email: user.email || '',
    role: fallbackRole,
    full_name: fullName || '',
    phone: undefined,
    country: undefined,
    city: undefined,
    avatar_url: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Profile;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/login';
}
