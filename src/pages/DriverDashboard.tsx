import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { supabase, getUserProfile, Profile } from '../lib/supabase';
import { setLanguageByCountry } from '../i18n';
import {
  detectLocationFromIp,
  geocodeCityCenter,
  readLocationOverride,
  writeLocationOverride,
} from '../lib/geo';
import { formatCurrency, getExchangeRate, normalizeCurrency, resolveCurrencyForCountry, roundAmount } from '../lib/currency';
import { 
  MapPin, 
  Navigation, 
  Loader2,
  AlertCircle,
  Car,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLngTuple } from 'leaflet';
import { useTranslation } from 'react-i18next';

// Types
interface Ride {
  id: string;
  client_id: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  pickup_city: string;
  pickup_country_code?: string | null;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  distance_km: number;
  passengers: number;
  base_price: number;
  final_price: number;
  allow_driver_offers?: boolean | null;
  client_offer_price?: number | null;
  status: string;
  created_at: string;
}

interface RideOffer {
  id: string;
  ride_id: string;
  driver_id: string;
  price_offer?: number | null;
  client_counter_price?: number | null;
  status?: string | null;
}

interface DriverLocation {
  lat: number;
  lng: number;
  city: string;
  countryCode?: string;
}

const MAX_GPS_ACCURACY_METERS = 500;

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_role: 'client' | 'driver';
  message: string;
  created_at: string;
}

async function reverseGeocodeCity(
  lat: number,
  lng: number
): Promise<{ city: string; countryCode?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    const city = data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state ||
      'Unknown';
    const countryCode = data.address?.country_code
      ? String(data.address.country_code).toUpperCase()
      : undefined;
    return { city, countryCode };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { city: 'Unknown', countryCode: undefined };
  }
}

function isSecureContextAvailable() {
  return (
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Custom icons
const pickupIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10B981; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const driverIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #3B82F6; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0M5 17H3v-4h18v4h-2M5 17v-6h14v6"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAPTILER_STYLE = import.meta.env.VITE_MAPTILER_STYLE || 'streets-v2';
const MAPTILER_FORMAT = /satellite|hybrid/i.test(MAPTILER_STYLE) ? 'jpg' : 'png';
const MAPTILER_TILE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/${MAPTILER_STYLE}/{z}/{x}/{y}.${MAPTILER_FORMAT}?key=${MAPTILER_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAPTILER_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DRIVER_LOCATION_OVERRIDE_KEY = 'driver_location_override_v1';

// Map center handler
function MapCenterHandler({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function DriverDashboard() {
  const { t } = useTranslation();
  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [offerInputs, setOfferInputs] = useState<Record<string, string>>({});
  const [myOffers, setMyOffers] = useState<Record<string, RideOffer>>({});
  const [settings, setSettings] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<{ full_name?: string; phone?: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<RideMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastLocationUpdateRef = useRef(0);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mapError, setMapError] = useState(false);
  const [showClientPhone, setShowClientPhone] = useState(false);
  const [rideNotification, setRideNotification] = useState<{ title: string; message: string } | null>(null);
  const notificationTimerRef = useRef<number | null>(null);
  const prevRideIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedRidesRef = useRef(false);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [displayPrice, setDisplayPrice] = useState(2);
  const [rideLocalCurrency, setRideLocalCurrency] = useState<string | null>(null);
  const [rideLocalRate, setRideLocalRate] = useState<number | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([43.238949, 76.889709]);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'unsupported'>('idle');
  const [gpsMessage, setGpsMessage] = useState('');

  useEffect(() => {
    if (!settings) return;
    let active = true;

    const updatePrice = async () => {
      const baseCurrencyRaw = settings.subscription_currency || settings.currency || 'USD';
      const baseCurrency = typeof baseCurrencyRaw === 'string' ? baseCurrencyRaw.toUpperCase() : 'USD';
      const basePriceValue = Number(settings.driver_subscription_price ?? 2);
      const basePrice = Number.isFinite(basePriceValue) ? basePriceValue : 2;

      setDisplayCurrency(normalizeCurrency(baseCurrency));
      setDisplayPrice(roundAmount(basePrice, normalizeCurrency(baseCurrency)));

      let countryCode = driverLocation?.countryCode;
      if (!countryCode) {
        const ipLocation = await detectLocationFromIp();
        countryCode = ipLocation?.countryCode;
      }
      if (!countryCode) return;

      const resolved = await resolveCurrencyForCountry(countryCode, baseCurrency);
      const rate = await getExchangeRate(baseCurrency, resolved.currency);
      if (!rate) return;

      const converted = roundAmount(basePrice * rate, resolved.currency);
      if (!active) return;
      setDisplayCurrency(resolved.currency);
      setDisplayPrice(converted);
    };

    updatePrice();
    return () => {
      active = false;
    };
  }, [settings, driverLocation?.countryCode]);

  useEffect(() => {
    if (!settings) return;
    let active = true;

    const updateRideCurrency = async () => {
      const baseCurrencyRaw = settings.currency || 'USD';
      const baseCurrency = typeof baseCurrencyRaw === 'string' ? baseCurrencyRaw.toUpperCase() : 'USD';
      const rideCity = activeRide?.pickup_city || availableRides[0]?.pickup_city;
      const rideCountryCode = activeRide?.pickup_country_code || availableRides[0]?.pickup_country_code;

      let countryCode: string | undefined;

      if (rideCountryCode) {
        countryCode = rideCountryCode;
      } else if (rideCity) {
        const rideGeo = await geocodeCityCenter(rideCity);
        countryCode = rideGeo?.countryCode;
      }

      if (!countryCode) {
        countryCode = driverLocation?.countryCode;
      }
      if (!countryCode) {
        const ipLocation = await detectLocationFromIp();
        countryCode = ipLocation?.countryCode;
      }
      if (!countryCode) {
        setRideLocalCurrency(null);
        setRideLocalRate(null);
        return;
      }

      const resolved = await resolveCurrencyForCountry(countryCode, baseCurrency);
      const rawCurrency = resolved.raw ? resolved.raw.toUpperCase() : undefined;
      if (!rawCurrency || rawCurrency === baseCurrency) {
        setRideLocalCurrency(null);
        setRideLocalRate(null);
        return;
      }
      const rate = await getExchangeRate(baseCurrency, rawCurrency);
      if (!active) return;
      if (!rate) {
        setRideLocalCurrency(null);
        setRideLocalRate(null);
        return;
      }
      setRideLocalCurrency(rawCurrency);
      setRideLocalRate(rate);
    };

    updateRideCurrency();
    return () => {
      active = false;
    };
  }, [settings, driverLocation?.countryCode, activeRide?.pickup_city, availableRides]);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.value = 523.25; // C5
      osc2.frequency.value = 659.25; // E5

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);

      osc2.onended = () => {
        ctx.close();
      };
    } catch {
      // ignore audio errors
    }
  }, []);

  const showRideNotification = useCallback((count: number) => {
    const title = t('driver.notifications.new_request_title', { defaultValue: 'New ride request' });
    const message = t('driver.notifications.new_request_body', {
      count,
      defaultValue: 'You have {{count}} new ride request(s).',
    });
    setRideNotification({ title, message });
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
    }
    notificationTimerRef.current = window.setTimeout(() => {
      setRideNotification(null);
    }, 7000);

    playNotificationSound();

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }, [playNotificationSound, t]);

  const pushDriverLocationCoords = useCallback(async (
    rideId: string,
    lat: number,
    lng: number,
    speedKmh: number | null,
    heading: number | null
  ) => {
    setDriverLocation((prev) => ({
      lat,
      lng,
      city: prev?.city || 'Unknown',
      countryCode: prev?.countryCode,
    }));
    setMapCenter([lat, lng]);

    await supabase
      .from('rides')
      .update({
        driver_lat: lat,
        driver_lng: lng,
        driver_updated_at: new Date().toISOString(),
        driver_speed_kmh: speedKmh,
        driver_heading: heading,
      })
      .eq('id', rideId)
      .eq('driver_id', profile?.id);
  }, [profile?.id]);

  const pushDriverLocation = useCallback(async (rideId: string, position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const speedKmh = position.coords.speed !== null && position.coords.speed !== undefined
      ? position.coords.speed * 3.6
      : null;
    const heading = position.coords.heading !== null && position.coords.heading !== undefined
      ? position.coords.heading
      : null;

    await pushDriverLocationCoords(rideId, lat, lng, speedKmh, heading);
  }, [pushDriverLocationCoords]);

  const isAccuratePosition = useCallback((position: GeolocationPosition) => {
    const accuracy = position.coords.accuracy;
    if (typeof accuracy === 'number' && accuracy > MAX_GPS_ACCURACY_METERS) {
      return false;
    }
    return true;
  }, []);

  const applyIpFallback = useCallback(async (rideId?: string) => {
    const info = await detectLocationFromIp();
    if (info && typeof info.lat === 'number' && typeof info.lng === 'number') {
      let { city, countryCode, lat, lng } = info;
      const reverse = await reverseGeocodeCity(lat, lng);
      city = reverse.city || city;
      if (!countryCode) countryCode = reverse.countryCode;

      setMapCenter([lat, lng]);
      setDriverLocation({
        lat,
        lng,
        city: city && city !== 'Unknown' ? city : 'Unknown',
        countryCode,
      });

      // Do not push IP-based coordinates to the ride.
      // IP location is often inaccurate and should not be used for client tracking.

      if (countryCode) {
        setLanguageByCountry(countryCode);
      }
      setGpsMessage(city ? t('driver.gps.detected_city', { city }) : t('driver.gps.detected'));
      return true;
    }

    const stored = readLocationOverride(DRIVER_LOCATION_OVERRIDE_KEY, 6 * 60 * 60 * 1000);
    if (!stored || typeof stored.lat !== 'number' || typeof stored.lng !== 'number') {
      return false;
    }

    setMapCenter([stored.lat, stored.lng]);
    setDriverLocation({
      lat: stored.lat,
      lng: stored.lng,
      city: stored.city && stored.city !== 'Unknown' ? stored.city : 'Unknown',
      countryCode: stored.countryCode,
    });

    // Do not push stored (non-GPS) coordinates to the ride.

    if (stored.countryCode) {
      setLanguageByCountry(stored.countryCode);
    }
    setGpsMessage(stored.city ? t('driver.gps.detected_city', { city: stored.city }) : t('driver.gps.detected'));
    return true;
  }, [activeRide?.id, profile?.city, profile?.country, pushDriverLocationCoords, t]);

  const updateProfileCity = useCallback(
    async (city?: string, countryCode?: string) => {
      if (!profile?.id || !city || city === 'Unknown') return;
      const normalized = city.trim().toLowerCase();
      if (profile.city && profile.city.trim().toLowerCase() === normalized) return;
      try {
        const updates: Record<string, string | null> = { city: city.trim() };
        if (countryCode) updates.country = countryCode.toUpperCase();
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);
        if (!error) {
          setProfile((prev) => (
            prev
              ? {
                  ...prev,
                  city: city.trim(),
                  country: countryCode || prev.country,
                  updated_at: new Date().toISOString(),
                }
              : prev
          ));
        }
      } catch {
        // ignore profile update errors
      }
    },
    [profile?.id, profile?.city]
  );

  const handleRedetectCity = useCallback(async () => {
    const previousStatus = gpsStatus;
    const previousMessage = gpsMessage;
    setGpsStatus('loading');
    setGpsMessage(t('driver.gps.requesting'));
    const ok = await applyIpFallback();
    if (ok) {
      setGpsStatus('ready');
      return;
    }
    setGpsStatus(previousStatus);
    setGpsMessage(previousMessage);
  }, [applyIpFallback, gpsMessage, gpsStatus, t]);

  const requestGeolocation = useCallback(async (fromUser: boolean = false) => {
    if (!isSecureContextAvailable()) {
      const httpsUrl = window.location.href.startsWith('http://')
        ? window.location.href.replace('http://', 'https://')
        : window.location.href;
      setGpsStatus('denied');
      setGpsMessage(t('driver.gps.https_required', { url: httpsUrl }));
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('unsupported');
      setGpsMessage(t('driver.gps.not_supported'));
      await applyIpFallback();
      return;
    }

    if (!fromUser && 'permissions' in navigator && navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          setGpsStatus('denied');
          setGpsMessage(
            t('driver.gps.blocked')
          );
          await applyIpFallback();
          return;
        }
      } catch (error) {
        console.warn('Permissions API unavailable:', error);
      }
    }

    setGpsStatus('loading');
    setGpsMessage(t('driver.gps.requesting'));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { city, countryCode } = await reverseGeocodeCity(latitude, longitude);

        setDriverLocation({ lat: latitude, lng: longitude, city, countryCode });
        setMapCenter([latitude, longitude]);
        if (countryCode) {
          setLanguageByCountry(countryCode);
        }
        updateProfileCity(city, countryCode);
        writeLocationOverride(DRIVER_LOCATION_OVERRIDE_KEY, {
          lat: latitude,
          lng: longitude,
          city: city && city !== 'Unknown' ? city : undefined,
          countryCode,
          updatedAt: Date.now(),
          source: 'gps',
        });
        setGpsStatus('ready');
        setGpsMessage(city ? t('driver.gps.detected_city', { city }) : t('driver.gps.detected'));
      },
      async (err) => {
        console.error('Geolocation error:', err);
        setGpsStatus('denied');
        setGpsMessage(
          t('driver.gps.denied')
        );
        await applyIpFallback();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [applyIpFallback, t, updateProfileCity]);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // ignore permission errors
      });
    }
  }, []);

  useEffect(() => {
    if (gpsStatus !== 'denied' && gpsStatus !== 'unsupported') return;
    const handleFocus = () => {
      requestGeolocation(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [gpsStatus, requestGeolocation]);

  // Load initial data once auth session is ready
  useEffect(() => {
    let authSub: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        initializeDashboard();
        return;
      }
      authSub = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession?.user) {
          initializeDashboard();
          authSub?.data.subscription.unsubscribe();
        }
      });
    };

    init();

    return () => {
      cancelled = true;
      authSub?.data.subscription.unsubscribe();
    };
  }, []);

  // Subscribe to ride updates
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel('available-rides')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rides'
      }, () => {
        loadAvailableRides(driverLocation?.lat, driverLocation?.lng, driverLocation?.city);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.id, driverLocation?.city, driverLocation?.lat, driverLocation?.lng]);
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel(`driver-active-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides',
        filter: `driver_id=eq.${profile.id}`,
      }, async () => {
        const active = await loadActiveRide(profile.id);
        if (!active && driverLocation?.city) {
          loadAvailableRides(driverLocation?.lat, driverLocation?.lng, driverLocation?.city);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.id, driverLocation?.city, driverLocation?.lat, driverLocation?.lng]);


  useEffect(() => {
    if (!profile?.id) return;
    loadAvailableRides(driverLocation?.lat, driverLocation?.lng, driverLocation?.city);
  }, [driverLocation?.city, driverLocation?.lat, driverLocation?.lng, profile?.id]);

  useEffect(() => {
    if (!profile?.city) return;
    if (gpsStatus === 'denied' || gpsStatus === 'unsupported') {
      applyIpFallback();
    }
  }, [applyIpFallback, gpsStatus, profile?.city]);

  useEffect(() => {
    if (!profile?.id) return;
    if (activeRide) return;

    const interval = setInterval(() => {
      loadAvailableRides(driverLocation?.lat, driverLocation?.lng, driverLocation?.city);
    }, 5000);

    return () => clearInterval(interval);
  }, [driverLocation?.city, driverLocation?.lat, driverLocation?.lng, profile?.id, activeRide]);

  useEffect(() => {
    if (!profile?.id || !activeRide) return;

    const interval = setInterval(() => {
      loadActiveRide(profile.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [profile?.id, activeRide?.id]);

  const initializeDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile();
      if (!userProfile) {
        setError(t('driver.errors.load_profile'));
        return;
      }
      setProfile(userProfile);
      setError('');

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (settingsError) {
        console.error('Failed to load settings:', settingsError);
      }
      setSettings(settingsData);

      // Load subscription status
      const { data: subData } = await supabase
        .from('driver_subscriptions')
        .select('*')
        .eq('driver_id', userProfile.id)
        .single();
      setSubscription(subData);

      const { data: verificationData } = await supabase
        .from('driver_verifications')
        .select('*')
        .eq('driver_id', userProfile.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setVerification(verificationData);

      // Check if driver has active ride
      const active = await loadActiveRide(userProfile.id);
      if (!active) {
        // Get driver location and load available rides
        requestGeolocation(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [requestGeolocation, t]);

  const getCurrentLocation = () => {
    requestGeolocation(true);
  };

  const loadActiveRide = async (driverId: string) => {
    const { data: activeRideData, error } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', ['driver_assigned', 'driver_arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to load active ride:', error);
    }

    if (activeRideData) {
      setActiveRide(activeRideData);
      return activeRideData;
    }

    setActiveRide(null);
    return null;
  };

  const loadAvailableRides = async (
    lat?: number,
    lng?: number,
    city?: string,
    fallback: boolean = false
  ) => {
    const searchCity = city || driverLocation?.city;

    try {
      let query = supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!fallback && searchCity && searchCity !== 'Unknown') {
        const escaped = searchCity.replace(/%/g, '');
        query = query.ilike('pickup_city', `%${escaped}%`);
      }

      const { data: rides, error } = await query;

      if (error) throw error;

      if (!fallback && (rides?.length ?? 0) === 0 && lat && lng) {
        await loadAvailableRides(lat, lng, searchCity, true);
        return;
      }

      let filtered = rides || [];
      if (fallback && lat && lng) {
        filtered = filtered.filter((ride) => {
          if (!ride.pickup_lat || !ride.pickup_lng) return false;
          const distance = calculateDistance(lat, lng, ride.pickup_lat, ride.pickup_lng);
          return distance <= 50;
        });
      }

      setAvailableRides(filtered);
      if (profile?.id && filtered.length > 0) {
        const rideIds = filtered.map((ride) => ride.id);
        const { data: offersData } = await supabase
          .from('ride_offers')
          .select('*')
          .eq('driver_id', profile.id)
          .in('ride_id', rideIds);
        const offerMap: Record<string, RideOffer> = {};
        (offersData || []).forEach((offer) => {
          offerMap[offer.ride_id] = offer as RideOffer;
        });
        setMyOffers(offerMap);
      } else {
        setMyOffers({});
      }
      const nextIds = new Set(filtered.map((ride) => ride.id));
      const prevIds = prevRideIdsRef.current;
      const newCount = Array.from(nextIds).filter((id) => !prevIds.has(id)).length;
      prevRideIdsRef.current = nextIds;
      if (hasLoadedRidesRef.current && newCount > 0 && !activeRide) {
        showRideNotification(newCount);
      }
      if (!hasLoadedRidesRef.current) {
        hasLoadedRidesRef.current = true;
      }
    } catch (err: any) {
      console.error('Error loading rides:', err);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    const refreshOnReturn = async () => {
      if (document.hidden) return;
      const active = await loadActiveRide(profile.id);
      if (!active) {
        loadAvailableRides(driverLocation?.lat, driverLocation?.lng, driverLocation?.city);
      }
    };
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [driverLocation?.city, driverLocation?.lat, driverLocation?.lng, loadActiveRide, profile?.id]);

  const loadMessages = async (rideId: string) => {
    const { data } = await supabase
      .from('ride_messages')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (data) setChatMessages(data as RideMessage[]);
  };

  const markChatRead = (timestamp?: string) => {
    if (!activeRide) return;
    const latest = timestamp || (chatMessages.length > 0
      ? chatMessages[chatMessages.length - 1].created_at
      : new Date().toISOString());
    const key = `ride_chat_last_read_driver_${activeRide.id}`;
    localStorage.setItem(key, latest);
    setLastReadAt(latest);
    setUnreadCount(0);
  };




  const openChatWindow = useCallback(() => {
    if (!activeRide) return;
    const url = `/driver/chat/${activeRide.id}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
  }, [activeRide]);

  const sendMessage = async () => {
    if (!activeRide || !profile?.id || !chatInput.trim()) return;
    setChatLoading(true);
    try {
      const { error: insertError } = await supabase.from('ride_messages').insert({
        ride_id: activeRide.id,
        sender_id: profile.id,
        sender_role: 'driver',
        message: chatInput.trim(),
      });

      if (insertError) throw insertError;
      setChatInput('');
      await loadMessages(activeRide.id);
      markChatRead(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || t('driver.errors.send_message_failed'));
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!activeRide) {
      setLastReadAt(null);
      setUnreadCount(0);
      return;
    }
    const key = `ride_chat_last_read_driver_${activeRide.id}`;
    const stored = localStorage.getItem(key);
    setLastReadAt(stored);
  }, [activeRide?.id]);

  useEffect(() => {
    if (!activeRide) return;
    const lastRead = lastReadAt ? new Date(lastReadAt).getTime() : 0;
    const count = chatMessages.filter((msg) => {
      const createdAt = new Date(msg.created_at).getTime();
      return msg.sender_id !== profile?.id && createdAt > lastRead;
    }).length;
    setUnreadCount(count);
  }, [activeRide?.id, chatMessages, lastReadAt, profile?.id]);

  useEffect(() => {
    if (!activeRide) {
      setClientProfile(null);
      setChatMessages([]);
      return;
    }

    let subscription: any;

    const setup = async () => {
      if (activeRide.client_id) {
        const { data: clientData } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', activeRide.client_id)
          .maybeSingle();
        if (clientData) setClientProfile(clientData);
      }

      await loadMessages(activeRide.id);
      subscription = supabase
        .channel(`ride-messages-${activeRide.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `ride_id=eq.${activeRide.id}`,
        }, () => {
          loadMessages(activeRide.id);
        })
        .subscribe();
    };

    setup();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [activeRide?.id, activeRide?.client_id, profile?.id]);

  useEffect(() => {
    setShowClientPhone(false);
  }, [activeRide?.id]);

  useEffect(() => {
    if (!activeRide || !profile?.id) return;
    if (!navigator.geolocation || !isSecureContextAvailable()) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastLocationUpdateRef.current < 5000) return;
        lastLocationUpdateRef.current = now;

        if (!isAccuratePosition(position)) {
          setGpsStatus('loading');
          setGpsMessage(t('driver.gps.requesting'));
          return;
        }

        await pushDriverLocation(activeRide.id, position);
      },
      async (err) => {
        console.error('Location tracking error:', err);
        const code = typeof err?.code === 'number' ? err.code : null;
        if (code === 1) {
          setGpsStatus('denied');
          setGpsMessage(t('driver.gps.denied_short'));
          if (!driverLocation) {
            await applyIpFallback();
          }
          return;
        }
        if (!driverLocation) {
          setGpsStatus('denied');
          setGpsMessage(t('driver.gps.denied_short'));
          await applyIpFallback();
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeRide?.id, applyIpFallback, driverLocation, isAccuratePosition, profile?.id, pushDriverLocation, t]);

  const sendOffer = async (ride: Ride) => {
    if (!profile?.id) return;
    const raw = offerInputs[ride.id];
    let price = Number(raw);
    if (!price || price <= 0) {
      setError(t('driver.errors.invalid_price', { defaultValue: 'Enter a valid price.' }));
      return;
    }
    if (rideLocalCurrency && rideLocalRate) {
      price = price / rideLocalRate;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ride_offers')
        .upsert({
          ride_id: ride.id,
          driver_id: profile.id,
          driver_lat: driverLocation?.lat,
          driver_lng: driverLocation?.lng,
          driver_name: profile.full_name || profile.email,
          price_offer: price,
          status: 'pending',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'ride_id,driver_id' })
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setMyOffers((prev) => ({ ...prev, [ride.id]: data as RideOffer }));
      }
      setSuccess(t('driver.notifications.offer_sent', { defaultValue: 'Offer sent to client.' }));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || t('driver.errors.offer_failed', { defaultValue: 'Failed to send offer.' }));
    } finally {
      setLoading(false);
    }
  };

  const acceptCounterOffer = async (ride: Ride, offer: RideOffer) => {
    if (!profile?.id) return;
    const counterPrice = Number(offer.client_counter_price ?? 0);
    if (!counterPrice) {
      setError(t('driver.errors.invalid_price', { defaultValue: 'Invalid counter price.' }));
      return;
    }

    setLoading(true);
    try {
      const { data: updatedRide, error } = await supabase
        .from('rides')
        .update({
          driver_id: profile.id,
          status: 'driver_assigned',
          final_price: counterPrice,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', ride.id)
        .eq('status', 'pending')
        .is('driver_id', null)
        .select('*')
        .maybeSingle();

      if (error || !updatedRide) {
        throw error || new Error('Ride already taken');
      }

      await supabase
        .from('ride_offers')
        .update({
          status: 'accepted',
          price_offer: counterPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offer.id);

      setActiveRide(updatedRide);
      setAvailableRides((prev) => prev.filter((item) => item.id !== ride.id));
    } catch (err: any) {
      setError(err?.message || t('driver.errors.accept_failed'));
    } finally {
      setLoading(false);
    }
  };

  const acceptClientOffer = async (ride: Ride) => {
    if (!profile?.id) return;
    const clientPrice = Number(ride.client_offer_price ?? 0);
    if (!clientPrice) {
      setError(t('driver.errors.invalid_price', { defaultValue: 'Invalid client price.' }));
      return;
    }

    setLoading(true);
    try {
      const { data: updatedRide, error } = await supabase
        .from('rides')
        .update({
          driver_id: profile.id,
          status: 'driver_assigned',
          final_price: clientPrice,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', ride.id)
        .eq('status', 'pending')
        .is('driver_id', null)
        .select('*')
        .maybeSingle();

      if (error || !updatedRide) {
        throw error || new Error('Ride already taken');
      }

      setActiveRide(updatedRide);
      setAvailableRides((prev) => prev.filter((item) => item.id !== ride.id));
    } catch (err: any) {
      setError(err?.message || t('driver.errors.accept_failed'));
    } finally {
      setLoading(false);
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data: updatedRide, error } = await supabase
        .from('rides')
        .update({
          driver_id: profile.id,
          status: 'driver_assigned',
        })
        .eq('id', rideId)
        .eq('status', 'pending')
        .is('driver_id', null)
        .select('*')
        .maybeSingle();

      if (error || !updatedRide) {
        throw new Error(t('driver.errors.ride_already_taken'));
      }

      setActiveRide(updatedRide);
      setAvailableRides((prev) => prev.filter((ride) => ride.id !== rideId));
      if (navigator.geolocation && isSecureContextAvailable()) {
        setGpsStatus('loading');
        setGpsMessage(t('driver.gps.requesting'));
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isAccuratePosition(position)) {
              setGpsStatus('loading');
              setGpsMessage(t('driver.gps.requesting'));
              return;
            }
            pushDriverLocation(rideId, position);
            setGpsStatus('ready');
            setGpsMessage(t('driver.gps.detected'));
          },
          async (err) => {
            console.error('Location error:', err);
            setGpsStatus('denied');
            setGpsMessage(t('driver.gps.denied_short'));
            await applyIpFallback(rideId);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
        );
      } else {
        await applyIpFallback(rideId);
      }
    } catch (err: any) {
      setError(err.message || t('driver.errors.accept_failed'));
    } finally {
      setLoading(false);
    }
  };

  const startRide = async (rideId: string) => {
    setLoading(true);
    try {
      await supabase
        .from('rides')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', rideId);
      
      initializeDashboard();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeRide = async (rideId: string) => {
    setLoading(true);
    try {
      await supabase
        .from('rides')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', rideId);
      
      setActiveRide(null);
      initializeDashboard();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check subscription status
  const isSubscriptionActive = () => {
    if (!settings?.require_driver_subscription) return true;
    if (!subscription) return false;
    if (subscription.is_free_access) return true;
    if (subscription.status === 'active' && new Date(subscription.expires_at) > new Date()) return true;
    return false;
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Subscription required view
  if (!isSubscriptionActive()) {
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Link
            to="/support"
            className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {t('common.support')}
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('driver.subscription_required.title')}</h2>
          <p className="text-gray-600 mb-6">
            {t('driver.subscription_required.subtitle')}
          </p>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold text-blue-900">
              {formatCurrency(displayPrice, displayCurrency)} / {t('subscription.subscribe.per_month', { defaultValue: 'month' })}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {t('driver.subscription_required.feature', { days: settings?.subscription_period_days || 30 })}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/subscription'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            {t('driver.subscription_required.subscribe')}
          </button>
        </div>
      </div>
    );
  }

  if (profile?.admin_blocked) {
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Link
            to="/support"
            className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {t('common.support')}
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('driver.verification.blocked_title')}</h2>
          <p className="text-gray-600 mb-6">{t('driver.verification.blocked_subtitle')}</p>
        </div>
      </div>
    );
  }

  if (!profile?.admin_approved) {
    const status = verification?.status as 'pending' | 'rejected' | undefined;
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Link
            to="/support"
            className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {t('common.support')}
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <ShieldCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('driver.verification.required_title')}</h2>
          <p className="text-gray-600 mb-6">
            {status === 'pending'
              ? t('driver.verification.pending_desc')
              : status === 'rejected'
                ? t('driver.verification.rejected_desc')
                : t('driver.verification.required_desc')}
          </p>
          {verification?.admin_note && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg text-sm mb-4">
              {verification.admin_note}
            </div>
          )}
          <Link
            to="/driver/verification"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-6 py-3 text-sm font-semibold"
          >
            {status === 'pending'
              ? t('driver.verification.view_application')
              : t('driver.verification.start_application')}
          </Link>
        </div>
      </div>
    );
  }

  // Active ride view
  if (activeRide) {
    const clientPhoneLink = clientProfile?.phone
      ? clientProfile.phone.replace(/[^\d+]/g, '')
      : '';

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('driver.active.title')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/support"
              className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              {t('common.support')}
            </Link>
            <Link
              to="/driver/settings"
              className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t('driver.account_settings')}
            </Link>
          </div>
        </div>

        {(gpsStatus === 'denied' || gpsStatus === 'unsupported') && (
          <div className="px-4 py-3 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-700">
            <div className="flex items-center justify-between gap-3">
              <span>{gpsMessage}</span>
              <button
                onClick={() => requestGeolocation(true)}
                className="px-3 py-1 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {t('driver.gps.enable_button')}
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              {t('driver.gps.hint')}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Map */}
          <div style={{ height: '280px' }}>
            <MapContainer
              center={[activeRide.pickup_lat, activeRide.pickup_lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution={MAPTILER_ATTRIBUTION}
                url={MAPTILER_TILE_URL}
                eventHandlers={{
                  tileerror: () => setMapError(true),
                }}
              />
              <Marker position={[activeRide.pickup_lat, activeRide.pickup_lng]} icon={pickupIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold">{t('driver.map.pickup_location')}</p>
                    <p className="text-sm">{activeRide.pickup_address}</p>
                  </div>
                </Popup>
              </Marker>
              {driverLocation && (
                <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                  <Popup>{t('driver.map.you_are_here')}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Ride Details */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">{t('driver.active.status')}</p>
                <p className="text-lg font-semibold capitalize">
                  {t(`status.${activeRide.status}`, { defaultValue: activeRide.status.replace('_', ' ') })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t('driver.active.earnings')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {rideLocalCurrency && rideLocalRate
                    ? formatCurrency(
                        roundAmount(Number(activeRide.final_price ?? 0) * rideLocalRate, rideLocalCurrency),
                        rideLocalCurrency
                      )
                    : formatCurrency(
                        Number(activeRide.final_price ?? 0),
                        (settings?.currency || 'USD').toUpperCase()
                      )}
                </p>
                {rideLocalCurrency && rideLocalRate && (
                  <p className="text-xs text-gray-400">
                    {formatCurrency(
                      Number(activeRide.final_price ?? 0),
                      (settings?.currency || 'USD').toUpperCase()
                    )}
                  </p>
                )}
                {activeRide.client_offer_price && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      {t('driver.available.client_offer', { defaultValue: 'Client offer' })}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {rideLocalCurrency && rideLocalRate
                        ? formatCurrency(
                            roundAmount(Number(activeRide.client_offer_price) * rideLocalRate, rideLocalCurrency),
                            rideLocalCurrency
                          )
                        : formatCurrency(
                            Number(activeRide.client_offer_price),
                            (settings?.currency || 'USD').toUpperCase()
                          )}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('driver.map.pickup')}</p>
                  <p className="font-medium">{activeRide.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Navigation className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('driver.map.dropoff')}</p>
                  <p className="font-medium">{activeRide.drop_address}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {activeRide.status === 'driver_assigned' && (
                <button
                  onClick={() => startRide(activeRide.id)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  {t('driver.active.start_ride')}
                </button>
              )}
              {activeRide.status === 'in_progress' && (
                <button
                  onClick={() => completeRide(activeRide.id)}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  {t('driver.active.complete_ride')}
                </button>
              )}
            </div>
          </div>
        </div>
        {mapError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            {t('driver.map.tile_error')}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{t('driver.active.client')}</h2>
              <p className="text-sm text-gray-500">
                {clientProfile?.full_name || t('driver.active.client_default')}
              </p>
            </div>
            {clientProfile?.phone && (
              <div className="flex flex-wrap items-center gap-2">
                {showClientPhone ? (
                  <>
                    <span className="text-sm text-gray-600">{clientProfile.phone}</span>
                    <a
                      href={`tel:${clientPhoneLink || clientProfile.phone}`}
                      className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    >
                      {t('driver.active.call')}
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowClientPhone(false)}
                      className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      {t('common.hide')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClientPhone(true)}
                    className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {t('driver.active.show_phone')}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openChatWindow}
              className="text-xs px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center"
            >
              {t('driver.active.open_chat')}
            </button>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                {t('driver.active.unread', { count: unreadCount })}
              </span>
            )}
          </div>

        </div>

      </div>
    );
  }

  // Main dashboard with available rides
  return (
    <div className="space-y-6">
      {rideNotification && (
        <div className="fixed top-4 right-4 z-50 w-80 rounded-xl border border-yellow-200 bg-white shadow-lg">
          <div className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">{rideNotification.title}</p>
              <p className="text-xs text-slate-600 mt-1">{rideNotification.message}</p>
            </div>
            <button
              onClick={() => setRideNotification(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
              aria-label="Close notification"
            >
              X
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('driver.available.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/support"
            className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {t('common.support')}
          </Link>
          <Link
            to="/driver/settings"
            className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {t('driver.account_settings')}
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {driverLocation && (
            <span className="text-sm text-gray-600">
              📍 {driverLocation.city}
            </span>
          )}
          <button
            onClick={() => loadAvailableRides(driverLocation?.lat, driverLocation?.lng, driverLocation?.city)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('common.refresh')}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {gpsStatus !== 'idle' && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            gpsStatus === 'denied' || gpsStatus === 'unsupported'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          {gpsStatus === 'loading' && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{gpsMessage}</span>
            </div>
          )}
          {gpsStatus === 'ready' && <span>{gpsMessage}</span>}
          {gpsStatus === 'denied' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span>{gpsMessage}</span>
                <button
                  onClick={() => requestGeolocation(true)}
                  className="px-3 py-1 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  {t('driver.gps.enable_button')}
                </button>
              </div>
              <p className="text-xs text-yellow-700">
                {t('driver.gps.hint')}
              </p>
            </div>
          )}
          {gpsStatus === 'unsupported' && <span>{gpsMessage}</span>}
          {gpsStatus !== 'loading' && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleRedetectCity}
                className={`px-3 py-1 rounded-lg border text-xs ${
                  gpsStatus === 'denied' || gpsStatus === 'unsupported'
                    ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                    : 'border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {t('common.refresh')}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div style={{ height: '360px' }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution={MAPTILER_ATTRIBUTION}
              url={MAPTILER_TILE_URL}
              eventHandlers={{
                tileerror: () => setMapError(true),
              }}
            />
            <MapCenterHandler center={mapCenter} />
            
            {driverLocation && (
              <>
                <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                  <Popup>{t('driver.map.you_are_here')}</Popup>
                </Marker>
                <Circle
                  center={[driverLocation.lat, driverLocation.lng]}
                  radius={5000}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                />
              </>
            )}
            
            {availableRides.map((ride) => {
              const offerMode = ride.allow_driver_offers || ride.final_price === null;
              return (
              <Marker key={ride.id} position={[ride.pickup_lat, ride.pickup_lng]} icon={pickupIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold">
                      {offerMode
                        ? t('driver.available.offer_required', { defaultValue: 'Offer required' })
                        : rideLocalCurrency && rideLocalRate
                          ? formatCurrency(roundAmount(Number(ride.final_price ?? ride.base_price) * rideLocalRate, rideLocalCurrency), rideLocalCurrency)
                          : formatCurrency(Number(ride.final_price ?? ride.base_price), (settings?.currency || 'USD').toUpperCase())}
                    </p>
                    <p className="text-sm">{ride.pickup_address}</p>
                    {!offerMode && (
                      <button
                        onClick={() => acceptRide(ride.id)}
                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        {t('driver.available.accept')}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
              );
            })}
          </MapContainer>
          </div>
        </div>
        {mapError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            {t('driver.map.tile_error')}
          </div>
        )}

        {/* Rides List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
      {availableRides.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('driver.available.none_title')}</h3>
          <p className="text-gray-500 mt-2">
            {driverLocation 
              ? t('driver.available.none_with_location')
              : t('driver.available.none_without_location')}
          </p>
              {!driverLocation && (
                <button
                  onClick={getCurrentLocation}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  {t('driver.gps.enable_location')}
                </button>
              )}
            </div>
          ) : (
            availableRides.map((ride) => {
              const offerMode = ride.allow_driver_offers || ride.final_price === null;
              const offer = myOffers[ride.id];
              const hasCounter = !!offer?.client_counter_price && offer?.status === 'countered';
              return (
                <div key={ride.id} className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {offerMode ? (
                        <>
                          <p className="text-lg font-bold text-slate-900">
                            {t('driver.available.offer_required', { defaultValue: 'Offer required' })}
                          </p>
                          {ride.client_offer_price && (
                            <div className="mt-1">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                {t('driver.available.client_offer', { defaultValue: 'Client offer' })}
                              </p>
                              <p className="text-lg font-bold text-blue-600">
                                {rideLocalCurrency && rideLocalRate
                                  ? formatCurrency(roundAmount(Number(ride.client_offer_price) * rideLocalRate, rideLocalCurrency), rideLocalCurrency)
                                  : formatCurrency(Number(ride.client_offer_price), (settings?.currency || 'USD').toUpperCase())}
                              </p>
                            </div>
                          )}
                          {offer?.price_offer && (
                            <p className="text-sm text-gray-500">
                              {t('driver.available.your_offer', { defaultValue: 'Your offer' })}:{' '}
                              {rideLocalCurrency && rideLocalRate
                                ? formatCurrency(roundAmount(Number(offer.price_offer) * rideLocalRate, rideLocalCurrency), rideLocalCurrency)
                                : formatCurrency(Number(offer.price_offer), (settings?.currency || 'USD').toUpperCase())}
                            </p>
                          )}
                          {hasCounter && (
                            <p className="text-sm text-orange-600">
                              {t('driver.available.counter_received', { defaultValue: 'Client counter' })}:{' '}
                              {formatCurrency(
                                Number(offer?.client_counter_price ?? 0),
                                (settings?.currency || 'USD').toUpperCase()
                              )}
                            </p>
                          )}
                        </>
                      ) : (
                        <div>
                          {rideLocalCurrency && rideLocalRate ? (
                            <>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(roundAmount(Number(ride.final_price ?? ride.base_price) * rideLocalRate, rideLocalCurrency), rideLocalCurrency)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatCurrency(Number(ride.final_price ?? ride.base_price), (settings?.currency || 'USD').toUpperCase())}
                              </p>
                            </>
                          ) : (
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(Number(ride.final_price ?? ride.base_price), (settings?.currency || 'USD').toUpperCase())}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">{getRelativeTime(ride.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                        {t('driver.available.passengers', { count: ride.passengers })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-700 line-clamp-2">{ride.pickup_address}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Navigation className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-700 line-clamp-2">{ride.drop_address}</p>
                    </div>
                    {ride.distance_km && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>📏 {ride.distance_km.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>

                  {offerMode ? (
                    <div className="space-y-2">
                      {hasCounter && offer ? (
                        <button
                          onClick={() => acceptCounterOffer(ride, offer)}
                          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                          {t('driver.available.accept_counter', { defaultValue: 'Accept counter' })}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {ride.client_offer_price && (
                            <button
                              onClick={() => acceptClientOffer(ride)}
                              className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                            >
                              {t('driver.available.accept_client_price', { defaultValue: 'Accept client price' })}
                            </button>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={offerInputs[ride.id] || ''}
                              onChange={(e) => setOfferInputs((prev) => ({ ...prev, [ride.id]: e.target.value }))}
                              placeholder={t('driver.available.offer_placeholder', { defaultValue: 'Your price' })}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <span className="text-xs text-gray-500">
                              {rideLocalCurrency || settings?.currency || 'USD'}
                            </span>
                            <button
                              onClick={() => sendOffer(ride)}
                              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                              {offer ? t('driver.available.update_offer', { defaultValue: 'Update' }) : t('driver.available.send_offer', { defaultValue: 'Send' })}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => acceptRide(ride.id)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      {t('driver.available.accept')}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
