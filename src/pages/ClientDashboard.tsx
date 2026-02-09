import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import { setLanguageByCountry } from '../i18n';
import {
  detectLocationFromIp,
  detectCountryCode,
  readLocationOverride,
  writeLocationOverride,
} from '../lib/geo';
import { formatCurrency, getExchangeRate, resolveCurrencyForCountry, roundAmount } from '../lib/currency';
import { 
  MapPin, 
  Navigation, 
  Users, 
  CreditCard, 
  Car,
  Loader2
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import { useTranslation } from 'react-i18next';

// Custom icons
const pickupIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10B981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; font-family: Arial, sans-serif;">
    A
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const dropIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #EF4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; font-family: Arial, sans-serif;">
    B
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const driverIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #2563EB; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0M5 17H3v-4h18v4h-2M5 17v-6h14v6"/>
    </svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
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
const CLIENT_LOCATION_OVERRIDE_KEY = 'client_location_override_v1';
const CLIENT_LAST_RIDE_KEY = 'client_last_active_ride_v1';
const DEFAULT_SETTINGS = {
  pricing_mode: 'distance',
  fixed_price_amount: 0,
  price_per_km: 1,
  currency: 'USD',
};

// Types
interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
  countryCode?: string;
}

interface Ride {
  id: string;
  status: string;
  pickup_address: string;
  drop_address: string;
  final_price: number;
  driver_id?: string;
  driver_lat?: number | null;
  driver_lng?: number | null;
  driver_updated_at?: string | null;
  driver_speed_kmh?: number | null;
  driver_heading?: number | null;
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  payment_method?: string;
}

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_role: 'client' | 'driver';
  message: string;
  created_at: string;
}

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

function MapCenterUpdater({ center }: { center: LatLngTuple }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [map, center]);

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [map]);

  return null;
}

function MapBoundsLimiter({
  center,
  radiusKm,
}: {
  center: LatLngTuple | null;
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    const lat = center[0];
    const lng = center[1];
    const latDelta = radiusKm / 110.574;
    const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [lat - latDelta, lng - lngDelta],
      [lat + latDelta, lng + lngDelta]
    );
    map.setMaxBounds(bounds);

    const handleDrag = () => {
      map.panInsideBounds(bounds, { animate: false });
    };
    map.on('drag', handleDrag);

    return () => {
      map.off('drag', handleDrag);
    };
  }, [center, map, radiusKm]);

  return null;
}

// Geocoding function
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; city: string; countryCode?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
    const countryCode = data.address?.country_code
      ? String(data.address.country_code).toUpperCase()
      : undefined;
    
    return { address, city, countryCode };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { 
      address: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 
      city: 'Unknown',
      countryCode: undefined,
    };
  }
}

async function forwardGeocode(
  query: string,
  cityFilter?: string,
  strictCityFilter: boolean = false
): Promise<Location[]> {
  try {
    const finalQuery = cityFilter ? `${query}, ${cityFilter}` : query;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(finalQuery)}`
    );
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const locations = data
      .map((item: any) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        const city = item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.state ||
          'Unknown';
        const countryCode = item.address?.country_code
          ? String(item.address.country_code).toUpperCase()
          : undefined;

        return {
          lat,
          lng,
          address: item.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city,
          countryCode,
        } as Location;
      })
      .filter(Boolean) as Location[];

    if (cityFilter && strictCityFilter) {
      const needle = cityFilter.toLowerCase();
      return locations.filter((location) =>
        location.city?.toLowerCase().includes(needle)
      );
    }

    return locations;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return [];
  }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


const MIN_CITY_RADIUS_KM = 8;
const MAX_CITY_RADIUS_KM = 120;

async function estimateCityRadiusKm(city: string, center: LatLngTuple): Promise<number | null> {
  try {
    if (!city || city === 'Unknown') return null;
    const [lat, lng] = center;
    const boxSize = 1.2;
    const left = lng - boxSize;
    const right = lng + boxSize;
    const top = lat + boxSize;
    const bottom = lat - boxSize;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(city)}&viewbox=${left},${top},${right},${bottom}&bounded=1`
    );
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const bbox = data[0].boundingbox;
    if (!bbox || bbox.length !== 4) return null;
    const south = Number(bbox[0]);
    const north = Number(bbox[1]);
    const west = Number(bbox[2]);
    const east = Number(bbox[3]);
    if ([south, north, west, east].some((value) => Number.isNaN(value))) return null;

    const distances = [
      calculateDistance(lat, lng, south, west),
      calculateDistance(lat, lng, south, east),
      calculateDistance(lat, lng, north, west),
      calculateDistance(lat, lng, north, east),
    ];
    const radius = Math.max(...distances);
    if (!Number.isFinite(radius) || radius <= 0) return null;
    return Math.min(MAX_CITY_RADIUS_KM, Math.max(MIN_CITY_RADIUS_KM, radius));
  } catch (error) {
    console.error('City radius lookup error:', error);
    return null;
  }
}

function estimateEtaMinutes(distanceKm: number, speedKmh?: number | null) {
  const speed = speedKmh && speedKmh > 3 ? speedKmh : 30;
  if (!distanceKm || speed <= 0) return null;
  return Math.max(1, Math.round((distanceKm / speed) * 60));
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  // State
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([43.238949, 76.889709]); // Almaty default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastRideStatusRef = useRef<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ title: string; message: string } | null>(null);
  const statusNotificationTimerRef = useRef<number | null>(null);
  
  // Active ride state
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [localCurrency, setLocalCurrency] = useState<string | null>(null);
  const [localRate, setLocalRate] = useState<number | null>(null);
  const [driverProfile, setDriverProfile] = useState<{ full_name?: string; phone?: string } | null>(null);
  const [showDriverPhone, setShowDriverPhone] = useState(false);
  const [chatMessages, setChatMessages] = useState<RideMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const loadActiveRideRef = useRef<(userId?: string | null) => void>(() => {});
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mapError, setMapError] = useState(false);

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

  const showStatusNotification = useCallback((message: string) => {
    const title = t('client.notifications.title', { defaultValue: 'Ride Update' });
    setStatusNotification({ title, message });
    if (statusNotificationTimerRef.current) {
      window.clearTimeout(statusNotificationTimerRef.current);
    }
    statusNotificationTimerRef.current = window.setTimeout(() => {
      setStatusNotification(null);
    }, 7000);

    playNotificationSound();

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }, [playNotificationSound, t]);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // ignore permission errors
      });
    }
  }, []);
  
  // Selection mode
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [lastTapTarget, setLastTapTarget] = useState<'pickup' | 'dropoff' | null>(null);
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<Location[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Location[]>([]);
  const [geoLoading, setGeoLoading] = useState<'pickup' | 'dropoff' | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'unsupported'>('idle');
  const [gpsMessage, setGpsMessage] = useState('');
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileCountry, setProfileCountry] = useState<string | null>(null);
  const [cityLock, setCityLock] = useState<string | null>(null);
  const [cityLockEnabled, setCityLockEnabled] = useState(false);
  const [cityCenter, setCityCenter] = useState<LatLngTuple | null>(null);
  const [cityRadiusKm, setCityRadiusKm] = useState(40);
  const mapDisplayCenter = useMemo<LatLngTuple>(() => {
    if (pickup) return [pickup.lat, pickup.lng];
    return mapCenter;
  }, [pickup?.lat, pickup?.lng, mapCenter]);
  const boundsCenter = useMemo<LatLngTuple | null>(() => {
    if (cityCenter) return cityCenter;
    if (pickup) return [pickup.lat, pickup.lng];
    return null;
  }, [cityCenter, pickup?.lat, pickup?.lng]);

  const rememberActiveRideId = useCallback((rideId?: string | null) => {
    try {
      if (rideId) {
        localStorage.setItem(CLIENT_LAST_RIDE_KEY, rideId);
      } else {
        localStorage.removeItem(CLIENT_LAST_RIDE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const readRememberedRideId = useCallback(() => {
    try {
      return localStorage.getItem(CLIENT_LAST_RIDE_KEY);
    } catch {
      return null;
    }
  }, []);

  // Load settings and active ride on mount
  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    let active = true;
    const loadCountry = async () => {
      const code = await detectCountryCode();
      if (!active) return;
      setCountryCode(code);
    };
    loadCountry();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settings || !countryCode) {
      setLocalCurrency(null);
      setLocalRate(null);
      return;
    }

    const baseCurrency = (settings?.currency || DEFAULT_SETTINGS.currency || 'USD').toUpperCase();
    let active = true;

    const resolveLocal = async () => {
      const resolved = await resolveCurrencyForCountry(countryCode, baseCurrency);
      const rawCurrency = resolved.raw ? resolved.raw.toUpperCase() : undefined;
      if (!rawCurrency || rawCurrency === baseCurrency) {
        if (active) {
          setLocalCurrency(null);
          setLocalRate(null);
        }
        return;
      }

      const rate = await getExchangeRate(baseCurrency, rawCurrency);
      if (!active) return;
      if (rate) {
        setLocalCurrency(rawCurrency);
        setLocalRate(rate);
      } else {
        setLocalCurrency(null);
        setLocalRate(null);
      }
    };

    resolveLocal();
    return () => {
      active = false;
    };
  }, [settings, countryCode]);

  useEffect(() => {
    if (!currentUserId) return;

    const subscription = supabase
      .channel(`client-rides-${currentUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides',
        filter: `client_id=eq.${currentUserId}`,
      }, (payload) => {
        const next = payload.new as Ride | undefined;
      if (next && ['pending', 'driver_assigned', 'driver_arrived', 'in_progress'].includes(next.status)) {
        setActiveRide(next);
        rememberActiveRideId(next.id);
      } else {
        rememberActiveRideId(null);
        loadActiveRide();
      }
    })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId, rememberActiveRideId]);

  useEffect(() => {
    if (!activeRide?.id) return;

    const subscription = supabase
      .channel(`ride-live-${activeRide.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: `id=eq.${activeRide.id}`,
      }, (payload) => {
        const next = payload.new as Ride | undefined;
        if (next && ['pending', 'driver_assigned', 'driver_arrived', 'in_progress'].includes(next.status)) {
          setActiveRide(next);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeRide?.id]);

  useEffect(() => {
    if (!currentUserId) return;
    const handleFocus = () => {
      loadActiveRideRef.current(currentUserId);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadActiveRideRef.current(currentUserId);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUserId]);

  const applyIpFallback = useCallback(async () => {
    const info = await detectLocationFromIp();
    if (info) {
      let { city, countryCode, lat, lng } = info;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const reverse = await reverseGeocode(lat, lng);
        city = reverse.city || city;
        if (!countryCode) countryCode = reverse.countryCode;
      }

      if (typeof lat === 'number' && typeof lng === 'number') {
        setMapCenter([lat, lng]);
        setCityCenter([lat, lng]);
      }

      if (city && city !== 'Unknown') {
        setCityLockEnabled(true);
        setCityLock(city);
      }

      if (countryCode) {
        setLanguageByCountry(countryCode);
      }

      setGpsMessage(city ? t('client.gps.detected_city', { city }) : t('client.gps.detected'));
      return true;
    }

    const stored = readLocationOverride(CLIENT_LOCATION_OVERRIDE_KEY);
    if (!stored) return false;

    if (typeof stored.lat === 'number' && typeof stored.lng === 'number') {
      setMapCenter([stored.lat, stored.lng]);
      setCityCenter([stored.lat, stored.lng]);
    }

    if (stored.city && stored.city !== 'Unknown') {
      setCityLockEnabled(true);
      setCityLock(stored.city);
    }

    if (stored.countryCode) {
      setLanguageByCountry(stored.countryCode);
    }

    setGpsMessage(stored.city ? t('client.gps.detected_city', { city: stored.city }) : t('client.gps.detected'));
    return true;
  }, [t]);

  const updateProfileCity = useCallback(
    async (city?: string, countryCode?: string) => {
      if (!currentUserId || !city || city === 'Unknown') return;
      const normalized = city.trim().toLowerCase();
      if (profileCity && profileCity.trim().toLowerCase() === normalized) return;
      try {
        const updates: Record<string, string | null> = { city: city.trim() };
        if (countryCode) updates.country = countryCode.toUpperCase();
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUserId);
        if (!error) {
          setProfileCity(city.trim());
          if (countryCode) setProfileCountry(countryCode.toUpperCase());
        }
      } catch {
        // ignore profile update errors
      }
    },
    [currentUserId, profileCity]
  );

  const handleRedetectCity = useCallback(async () => {
    const previousStatus = gpsStatus;
    const previousMessage = gpsMessage;
    setGpsStatus('loading');
    setGpsMessage(t('client.gps.requesting'));
    const ok = await applyIpFallback();
    if (ok) {
      setGpsStatus('ready');
      return;
    }
    setGpsStatus(previousStatus);
    setGpsMessage(previousMessage);
  }, [applyIpFallback, gpsMessage, gpsStatus, t]);

  const requestGeolocation = useCallback(async (fromUser: boolean = false) => {
    const isSecureContext =
      window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecureContext) {
      const httpsUrl = window.location.href.startsWith('http://')
        ? window.location.href.replace('http://', 'https://')
        : window.location.href;
      setGpsStatus('denied');
      setGpsMessage(t('client.gps.https_required', { url: httpsUrl }));
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('unsupported');
      setGpsMessage(t('client.gps.not_supported'));
      await applyIpFallback();
      return;
    }

    if (!fromUser && 'permissions' in navigator && navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          setGpsStatus('denied');
          setGpsMessage(
            t('client.gps.blocked')
          );
          await applyIpFallback();
          return;
        }
      } catch (error) {
        console.warn('Permissions API unavailable:', error);
      }
    }

    setGpsStatus('loading');
    setGpsMessage(t('client.gps.requesting'));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const { address, city, countryCode } = await reverseGeocode(lat, lng);
        setMapCenter([lat, lng]);
        setPickup({ lat, lng, address, city, countryCode });
        setPickupQuery(address);
        setCityCenter([lat, lng]);
        setCityLockEnabled(true);
        if (city && city !== 'Unknown') {
          setCityLock(city);
        }
        if (countryCode) {
          setLanguageByCountry(countryCode);
        }
        updateProfileCity(city, countryCode);
        writeLocationOverride(CLIENT_LOCATION_OVERRIDE_KEY, {
          lat,
          lng,
          city: city && city !== 'Unknown' ? city : undefined,
          countryCode,
          updatedAt: Date.now(),
          source: 'gps',
        });
        setGpsStatus('ready');
        setGpsMessage(city ? t('client.gps.detected_city', { city }) : t('client.gps.detected'));
      },
      async (err) => {
        console.error('Geolocation error:', err);
        setGpsStatus('denied');
        setGpsMessage(
          t('client.gps.denied')
        );
        await applyIpFallback();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [applyIpFallback, t, updateProfileCity]);

  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  useEffect(() => {
    if (gpsStatus !== 'denied' && gpsStatus !== 'unsupported') return;
    const handleFocus = () => {
      requestGeolocation(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [gpsStatus, requestGeolocation]);

  useEffect(() => {
    if (!cityLockEnabled || !cityLock || !cityCenter) {
      setCityRadiusKm(40);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const radius = await estimateCityRadiusKm(cityLock, cityCenter);
      if (!cancelled && radius) {
        setCityRadiusKm(radius);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [cityLockEnabled, cityLock, cityCenter]);

  useEffect(() => {
    let authSub: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      const userId = session?.user?.id ?? null;
      setCurrentUserId(userId);
      if (userId) {
        loadActiveRide(userId);
        return;
      }
      authSub = supabase.auth.onAuthStateChange((_event, nextSession) => {
        const nextUserId = nextSession?.user?.id ?? null;
        setCurrentUserId(nextUserId);
        if (nextUserId) {
          loadActiveRide(nextUserId);
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

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    const loadProfileCity = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('city, country, updated_at')
        .eq('id', currentUserId)
        .maybeSingle();
      if (cancelled || !data) return;
      setProfileCity(data.city || null);
      setProfileCountry(data.country || null);
    };
    loadProfileCity();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);


  useEffect(() => {
    if (!currentUserId) return;
    loadActiveRide(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (!activeRide) {
      setLastReadAt(null);
      setUnreadCount(0);
      return;
    }
    const key = `ride_chat_last_read_client_${activeRide.id}`;
    const stored = localStorage.getItem(key);
    setLastReadAt(stored);
  }, [activeRide?.id]);

  useEffect(() => {
    if (!activeRide) return;
    const lastRead = lastReadAt ? new Date(lastReadAt).getTime() : 0;
    const count = chatMessages.filter((msg) => {
      const createdAt = new Date(msg.created_at).getTime();
      return msg.sender_id !== currentUserId && createdAt > lastRead;
    }).length;
    setUnreadCount(count);
  }, [activeRide?.id, chatMessages, currentUserId, lastReadAt]);

  useEffect(() => {
    if (!activeRide) {
      lastRideStatusRef.current = null;
      return;
    }

    const previousStatus = lastRideStatusRef.current;
    if (previousStatus && previousStatus !== activeRide.status) {
      if (activeRide.status === 'driver_assigned') {
        const msg = t('client.notifications.driver_assigned');
        setSuccess(msg);
        showStatusNotification(msg);
        setTimeout(() => setSuccess(''), 5000);
      } else if (activeRide.status === 'driver_arrived') {
        const msg = t('client.notifications.driver_arrived');
        setSuccess(msg);
        showStatusNotification(msg);
        setTimeout(() => setSuccess(''), 5000);
      } else if (activeRide.status === 'in_progress') {
        const msg = t('client.notifications.trip_started');
        setSuccess(msg);
        showStatusNotification(msg);
        setTimeout(() => setSuccess(''), 5000);
      }
    }

    lastRideStatusRef.current = activeRide.status;
  }, [activeRide?.id, activeRide?.status, showStatusNotification, t]);


  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Failed to load settings:', error);
    }
    setSettings(data ?? DEFAULT_SETTINGS);
  };

  const loadActiveRide = useCallback(async (userId?: string | null) => {
    const targetUserId = userId ?? currentUserId;
    if (!targetUserId) return;

    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('client_id', targetUserId)
      .in('status', ['pending', 'driver_assigned', 'driver_arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveRide(data);
      rememberActiveRideId(data.id);
      // Set map to pickup location
      setMapCenter([data.pickup_lat, data.pickup_lng]);
    } else {
      const storedId = readRememberedRideId();
      if (storedId) {
        const { data: storedRide } = await supabase
          .from('rides')
          .select('*')
          .eq('id', storedId)
          .maybeSingle();
        if (storedRide && ['pending', 'driver_assigned', 'driver_arrived', 'in_progress'].includes(storedRide.status)) {
          setActiveRide(storedRide);
          setMapCenter([storedRide.pickup_lat, storedRide.pickup_lng]);
          return;
        }
        rememberActiveRideId(null);
      }
      setActiveRide(null);
    }
  }, [currentUserId, readRememberedRideId, rememberActiveRideId]);

  useEffect(() => {
    loadActiveRideRef.current = loadActiveRide;
  }, [loadActiveRide]);

  const normalizeText = useCallback((value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, []);

  const isCityAllowed = useCallback((location: Location) => {
    if (!cityLockEnabled) return true;

    if (cityLock) {
      const normalizedCity = normalizeText(cityLock);
      const cityMatch = location.city
        ? normalizeText(location.city).includes(normalizedCity)
        : false;
      const addressMatch = location.address
        ? normalizeText(location.address).includes(normalizedCity)
        : false;

      if (cityMatch || addressMatch) return true;
    }

    if (cityCenter) {
      const distance = calculateDistance(
        cityCenter[0],
        cityCenter[1],
        location.lat,
        location.lng
      );
      return distance <= cityRadiusKm;
    }

    return false;
  }, [cityCenter, cityLock, cityLockEnabled, cityRadiusKm, normalizeText]);

  const applyLocation = useCallback((type: 'pickup' | 'dropoff', location: Location) => {
    if (!isCityAllowed(location)) {
    const lockLabel = cityLock
      ? t('client.errors.city_inside', { city: cityLock })
      : t('client.errors.city_nearby');
    setError(t('client.errors.location_outside', { area: lockLabel }));
      return;
    }

    setError('');

    if (!cityCenter) {
      setCityCenter([location.lat, location.lng]);
    }

    if (!cityLockEnabled) {
      setCityLockEnabled(true);
    }

    if (!cityLock && location.city && location.city !== 'Unknown') {
      setCityLock(location.city);
    }

    if (type === 'pickup') {
      setPickup(location);
      setPickupQuery(location.address);
      setPickupSuggestions([]);
      updateProfileCity(location.city, location.countryCode);
      writeLocationOverride(CLIENT_LOCATION_OVERRIDE_KEY, {
        lat: location.lat,
        lng: location.lng,
        city: location.city && location.city !== 'Unknown' ? location.city : undefined,
        countryCode: location.countryCode,
        updatedAt: Date.now(),
        source: 'manual',
      });
    } else {
      setDropoff(location);
      setDropoffQuery(location.address);
      setDropoffSuggestions([]);
    }
    setMapCenter([location.lat, location.lng]);
    setSelectionMode(null);
  }, [cityLock, isCityAllowed, updateProfileCity]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    let mode = selectionMode;
    if (!mode) {
      if (!pickup && !dropoff) {
        mode = 'pickup';
      } else if (pickup && !dropoff) {
        mode = 'dropoff';
      } else if (!pickup && dropoff) {
        mode = 'pickup';
      } else {
        mode = lastTapTarget === 'pickup' ? 'dropoff' : 'pickup';
      }
    }

    setLoading(true);
    const { address, city, countryCode } = await reverseGeocode(lat, lng);
    applyLocation(mode, { lat, lng, address, city, countryCode });
    setLastTapTarget(mode);
    setLoading(false);
  }, [selectionMode, pickup, dropoff, lastTapTarget, applyLocation]);

  const runSearch = useCallback(async (
    type: 'pickup' | 'dropoff',
    query: string,
    showErrors: boolean
  ) => {
    if (!query.trim()) return;

    setGeoLoading(type);
    const cityFilter = cityLockEnabled && cityLock ? cityLock : undefined;
    let results = await forwardGeocode(query.trim(), cityFilter, Boolean(cityFilter));
    if (cityLockEnabled && cityCenter) {
      results = results.filter(isCityAllowed);
    }
    if (type === 'pickup') {
      setPickupSuggestions(results);
    } else {
      setDropoffSuggestions(results);
    }

    if (showErrors) {
      if (results.length === 0) {
        setError(
          cityFilter
            ? t('client.errors.no_results_city', { city: cityFilter })
            : t('client.errors.no_results')
        );
      } else {
        setError('');
      }
    }

    if (results.length === 1) {
      applyLocation(type, results[0]);
    }

    setGeoLoading(null);
  }, [applyLocation, cityCenter, cityLock, cityLockEnabled, isCityAllowed]);

  const handleSearch = async (type: 'pickup' | 'dropoff') => {
    const query = type === 'pickup' ? pickupQuery : dropoffQuery;
    await runSearch(type, query, true);
  };

  const selectSuggestion = (type: 'pickup' | 'dropoff', location: Location) => {
    applyLocation(type, location);
  };

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
    const key = `ride_chat_last_read_client_${activeRide.id}`;
    localStorage.setItem(key, latest);
    setLastReadAt(latest);
    setUnreadCount(0);
  };




  const openChatWindow = useCallback(() => {
    if (!activeRide) return;
    const url = `/client/chat/${activeRide.id}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = url;
    }
  }, [activeRide]);

  const sendMessage = async () => {
    if (!activeRide || !currentUserId || !chatInput.trim()) return;
    setChatLoading(true);
    try {
      const { error: insertError } = await supabase.from('ride_messages').insert({
        ride_id: activeRide.id,
        sender_id: currentUserId,
        sender_role: 'client',
        message: chatInput.trim(),
      });

      if (insertError) throw insertError;
      setChatInput('');
      await loadMessages(activeRide.id);
      markChatRead(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || t('client.errors.send_message_failed'));
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
      setDriverProfile(null);
      setChatMessages([]);
      return;
    }

    let subscription: any;

    const setup = async () => {
      if (activeRide.driver_id) {
        const { data: driverData } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', activeRide.driver_id)
          .maybeSingle();
        if (driverData) setDriverProfile(driverData);
      }

      if (activeRide.status !== 'pending') {
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
      }
    };

    setup();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [activeRide?.id, activeRide?.status, activeRide?.driver_id, currentUserId]);

  useEffect(() => {
    setShowDriverPhone(false);
  }, [activeRide?.id]);

  useEffect(() => {
    const query = pickupQuery.trim();
    if (!query || (pickup && pickupQuery === pickup.address)) {
      setPickupSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      runSearch('pickup', query, false);
    }, 450);
    return () => clearTimeout(handle);
  }, [pickup, pickupQuery, runSearch]);

  useEffect(() => {
    const query = dropoffQuery.trim();
    if (!query || (dropoff && dropoffQuery === dropoff.address)) {
      setDropoffSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      runSearch('dropoff', query, false);
    }, 450);
    return () => clearTimeout(handle);
  }, [dropoff, dropoffQuery, runSearch]);

  const calculatePrice = () => {
    if (!pickup || !dropoff) return 0;
    const passengerCount = Math.max(1, passengers);

    const mode = settings?.pricing_mode || DEFAULT_SETTINGS.pricing_mode;
    if (mode === 'fixed') {
      const fixed = Number(settings?.fixed_price_amount ?? DEFAULT_SETTINGS.fixed_price_amount);
      const base = Number.isFinite(fixed) ? fixed : 0;
      return Math.max(0, Math.round(base * passengerCount));
    }

    const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const perKm = Number(settings?.price_per_km ?? DEFAULT_SETTINGS.price_per_km);
    const price = Number.isFinite(perKm) ? distance * perKm : 0;
    return Math.max(0, Math.round(price * passengerCount));
  };

  const createRide = async () => {
    if (!pickup || !dropoff) {
      setError('Please select both pickup and drop-off locations');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
      const price = calculatePrice();

      const { data, error: insertError } = await supabase
        .from('rides')
        .insert({
          client_id: user.data.user.id,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          pickup_address: pickup.address,
          pickup_city: pickup.city,
          drop_lat: dropoff.lat,
          drop_lng: dropoff.lng,
          drop_address: dropoff.address,
          drop_city: dropoff.city,
          distance_km: Math.round(distance * 100) / 100,
          passengers: passengers,
          base_price: price,
          final_price: price,
          status: 'pending',
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(t('client.notifications.request_created'));
      setActiveRide(data);
      rememberActiveRideId(data.id);
      
      // Clear form
      setPickup(null);
      setDropoff(null);
      setPassengers(1);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || t('client.errors.create_ride_failed'));
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide || !currentUserId) return;
    
    if (!confirm(t('client.confirm_cancel'))) return;

    setLoading(true);
    setError('');
    try {
      const { data: updatedRide, error } = await supabase
        .from('rides')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled by client'
        })
        .eq('id', activeRide.id)
        .eq('client_id', currentUserId)
        .in('status', ['pending', 'driver_assigned', 'driver_arrived', 'in_progress'])
        .select('*')
        .maybeSingle();

      if (error || !updatedRide) {
        throw error || new Error('Failed to cancel ride');
      }

      setActiveRide(null);
      rememberActiveRideId(null);
      setSuccess(t('client.notifications.ride_cancelled'));
    } catch (err: any) {
      setError(err?.message || t('client.errors.cancel_failed', { defaultValue: 'Failed to cancel ride' }));
    } finally {
      setLoading(false);
    }
  };

  // Render active ride view
  if (activeRide) {
    const hasDriverLocation =
      activeRide.driver_lat !== null &&
      activeRide.driver_lat !== undefined &&
      activeRide.driver_lng !== null &&
      activeRide.driver_lng !== undefined;
    const activeCenter: LatLngTuple = hasDriverLocation
      ? [activeRide.driver_lat as number, activeRide.driver_lng as number]
      : [activeRide.pickup_lat, activeRide.pickup_lng];
    const targetLat = activeRide.status === 'in_progress' ? activeRide.drop_lat : activeRide.pickup_lat;
    const targetLng = activeRide.status === 'in_progress' ? activeRide.drop_lng : activeRide.pickup_lng;
    const driverDistanceKm = hasDriverLocation
      ? calculateDistance(activeRide.driver_lat as number, activeRide.driver_lng as number, targetLat, targetLng)
      : null;
    const etaMinutes = driverDistanceKm !== null
      ? estimateEtaMinutes(driverDistanceKm, activeRide.driver_speed_kmh)
      : null;
    const driverSpeed = activeRide.driver_speed_kmh ? Math.round(activeRide.driver_speed_kmh) : null;
    const driverHeading = activeRide.driver_heading !== null && activeRide.driver_heading !== undefined
      ? Math.round(activeRide.driver_heading)
      : null;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('client.active.title')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/support"
              className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              {t('common.support')}
            </Link>
            <Link
              to="/client/settings"
              className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t('client.account_settings')}
            </Link>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div style={{ height: '280px' }}>
            <MapContainer
              center={activeCenter}
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
              <MapCenterUpdater center={activeCenter} />
              <Marker position={[activeRide.pickup_lat, activeRide.pickup_lng]} icon={pickupIcon}>
                <Popup>{t('client.map.pickup')}: {activeRide.pickup_address}</Popup>
              </Marker>
              <Marker position={[activeRide.drop_lat, activeRide.drop_lng]} icon={dropIcon}>
                <Popup>{t('client.map.dropoff')}: {activeRide.drop_address}</Popup>
              </Marker>
              {hasDriverLocation && (
                <Marker position={[activeRide.driver_lat as number, activeRide.driver_lng as number]} icon={driverIcon}>
                  <Popup>{t('client.map.driver_location')}</Popup>
                </Marker>
              )}
              {activeRide.pickup_lat && activeRide.drop_lat && (
                <Polyline
                  positions={[[activeRide.pickup_lat, activeRide.pickup_lng], [activeRide.drop_lat, activeRide.drop_lng]]}
                  color="#3B82F6"
                  weight={4}
                  dashArray="8, 8"
                />
              )}
            </MapContainer>
          </div>
        </div>
        {mapError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            {t('client.map.tile_error')}
          </div>
        )}

        {/* Ride Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${
                activeRide.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                activeRide.status === 'driver_assigned' ? 'bg-blue-100 text-blue-600' :
                activeRide.status === 'in_progress' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Car className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {activeRide.status === 'pending' && t('client.active.status_pending')}
                  {activeRide.status === 'driver_assigned' && t('client.active.status_assigned')}
                  {activeRide.status === 'driver_arrived' && t('client.active.status_arrived')}
                  {activeRide.status === 'in_progress' && t('client.active.status_in_progress')}
                </p>
                <p className="text-sm text-gray-500">{t('client.active.status_label', { status: t(`status.${activeRide.status}`, { defaultValue: activeRide.status }) })}</p>
              </div>
            </div>
            <button
              onClick={cancelRide}
              disabled={loading}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              {t('client.active.cancel')}
            </button>
          </div>

          {/* Route Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('client.map.pickup')}</p>
                <p className="font-medium">{activeRide.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Navigation className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('client.map.dropoff')}</p>
                <p className="font-medium">{activeRide.drop_address}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">{t('client.active.price')}</p>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    Number(activeRide.final_price || 0),
                    (settings?.currency || DEFAULT_SETTINGS.currency || 'USD').toUpperCase()
                  )}
                </p>
                {localCurrency && localRate && (
                  <p className="text-base font-semibold text-slate-700">
                    ≈ {formatCurrency(
                      roundAmount(Number(activeRide.final_price || 0) * localRate, localCurrency),
                      localCurrency
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{t('client.active.payment')}</p>
              <p className="font-medium capitalize">{t(`payment.${activeRide.payment_method || 'cash'}`, { defaultValue: activeRide.payment_method || 'cash' })}</p>
            </div>
          </div>
        </div>

        {activeRide.status === 'pending' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold">{t('client.active.waiting_title')}</h2>
            <p className="text-gray-500 mt-2">{t('client.active.waiting_subtitle')}</p>
          </div>
        )}

        {activeRide.status !== 'pending' && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{t('client.active.driver_title')}</h2>
                <p className="text-sm text-gray-500">
                  {driverProfile?.full_name || t('client.active.driver_assigned')}
                </p>
              </div>
              {driverProfile?.phone && (
                <div className="flex flex-wrap items-center gap-2">
                  {showDriverPhone ? (
                    <>
                      <span className="text-sm text-gray-600">{driverProfile.phone}</span>
                      <a
                        href={`tel:${driverProfile.phone.replace(/[^\d+]/g, '') || driverProfile.phone}`}
                        className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                      >
                        {t('client.active.call')}
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowDriverPhone(false)}
                        className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        {t('common.hide')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDriverPhone(true)}
                      className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {t('client.active.show_phone')}
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openChatWindow}
                  className="text-xs px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center"
                >
                  {t('client.active.open_chat')}
                </button>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {t('client.active.unread', { count: unreadCount })}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              {driverDistanceKm !== null && (
                <p>{t('client.active.driver_distance', { km: driverDistanceKm.toFixed(1) })}</p>
              )}
              {etaMinutes !== null && (
                <p>{t('client.active.eta', { minutes: etaMinutes })}</p>
              )}
              {driverSpeed !== null && (
                <p>{t('client.active.speed', { speed: driverSpeed })}</p>
              )}
              {driverHeading !== null && (
                <p>{t('client.active.heading', { heading: driverHeading })}</p>
              )}
            </div>

          </div>
        )}

      </div>
    );
  }

  // Render new ride form
  return (
    <div className="space-y-6">
      {statusNotification && (
        <div className="fixed top-4 right-4 z-50 w-80 rounded-xl border border-blue-200 bg-white shadow-lg">
          <div className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-bold text-slate-900">{statusNotification.title}</p>
              <p className="text-xs text-slate-600 mt-1">{statusNotification.message}</p>
            </div>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
              aria-label="Close notification"
            >
              X
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('client.request.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/support"
            className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            {t('common.support')}
          </Link>
          <Link
            to="/client/settings"
            className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {t('client.account_settings')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

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
                  {t('client.gps.enable_button')}
                </button>
              </div>
              <p className="text-xs text-yellow-700">
                {t('client.gps.hint')}
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

      {cityLockEnabled && (
        <div className="px-4 py-2 rounded-lg border border-blue-100 bg-blue-50 text-blue-700 text-sm">
          {t('client.city_lock', { city: cityLock || t('client.city_lock_default') })}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <p className="text-sm text-gray-600">
              {t('client.map.instructions')}
            </p>
          </div>
          <div style={{ height: '360px' }}>
            <MapContainer
              center={mapDisplayCenter}
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
              <MapClickHandler onMapClick={handleMapClick} />
              <MapCenterUpdater center={mapDisplayCenter} />
              <MapBoundsLimiter center={boundsCenter} radiusKm={cityRadiusKm} />
              
              {pickup && (
                <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                  <Popup>{t('client.map.pickup')}: {pickup.address}</Popup>
                </Marker>
              )}
              
              {dropoff && (
                <Marker position={[dropoff.lat, dropoff.lng]} icon={dropIcon}>
                  <Popup>{t('client.map.dropoff')}: {dropoff.address}</Popup>
                </Marker>
              )}
              
              {pickup && dropoff && (
                <Polyline
                  positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
                  color="#3B82F6"
                  weight={4}
                  dashArray="10, 10"
                />
              )}
            </MapContainer>
          </div>
        </div>
        {mapError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            {t('client.map.tile_error')}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Pickup Location */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 font-medium">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <span>{t('client.pickup.title')}</span>
              </label>
              <button
                onClick={() => setSelectionMode('pickup')}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  selectionMode === 'pickup' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectionMode === 'pickup' ? t('client.select_on_map_active') : t('client.select_on_map')}
              </button>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => {
                    setPickupQuery(e.target.value);
                    setPickupSuggestions([]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch('pickup');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    cityLockEnabled && cityLock
                      ? t('client.pickup.placeholder_city', { city: cityLock })
                      : t('client.pickup.placeholder')
                  }
                />
                <button
                  onClick={() => handleSearch('pickup')}
                  disabled={geoLoading === 'pickup'}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {geoLoading === 'pickup' ? '...' : t('common.find')}
                </button>
              </div>
              {pickupSuggestions.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {pickupSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                      type="button"
                      onClick={() => selectSuggestion('pickup', suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{suggestion.address}</p>
                      <p className="text-xs text-gray-500">{suggestion.city}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {pickup ? (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium text-green-900">{pickup.address}</p>
                <p className="text-sm text-green-700">{pickup.city}</p>
                <button
                  onClick={() => setPickup(null)}
                  className="text-sm text-green-600 hover:text-green-800 mt-2"
                >
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                {pickupQuery
                  ? t('client.pickup.helper')
                  : t('client.pickup.none')}
              </p>
            )}
          </div>

          {/* Drop-off Location */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 font-medium">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-red-600" />
                </div>
                <span>{t('client.dropoff.title')}</span>
              </label>
              <button
                onClick={() => setSelectionMode('dropoff')}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  selectionMode === 'dropoff' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectionMode === 'dropoff' ? t('client.select_on_map_active') : t('client.select_on_map')}
              </button>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dropoffQuery}
                  onChange={(e) => {
                    setDropoffQuery(e.target.value);
                    setDropoffSuggestions([]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch('dropoff');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    cityLockEnabled && cityLock
                      ? t('client.dropoff.placeholder_city', { city: cityLock })
                      : t('client.dropoff.placeholder')
                  }
                />
                <button
                  onClick={() => handleSearch('dropoff')}
                  disabled={geoLoading === 'dropoff'}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {geoLoading === 'dropoff' ? '...' : t('common.find')}
                </button>
              </div>
              {dropoffSuggestions.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {dropoffSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                      type="button"
                      onClick={() => selectSuggestion('dropoff', suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{suggestion.address}</p>
                      <p className="text-xs text-gray-500">{suggestion.city}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {dropoff ? (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium text-red-900">{dropoff.address}</p>
                <p className="text-sm text-red-700">{dropoff.city}</p>
                <button
                  onClick={() => setDropoff(null)}
                  className="text-sm text-red-600 hover:text-red-800 mt-2"
                >
                  {t('common.change')}
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                {dropoffQuery
                  ? t('client.dropoff.helper')
                  : t('client.dropoff.none')}
              </p>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {/* Passengers */}
            <div>
              <label className="flex items-center space-x-2 font-medium mb-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span>{t('client.options.passengers')}</span>
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-8 text-center">{passengers}</span>
                <button
                  onClick={() => setPassengers(Math.min(20, passengers + 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="flex items-center space-x-2 font-medium mb-2">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <span>{t('client.options.payment_method')}</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('payment.cash')}
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t('payment.card')}
                </button>
              </div>
            </div>
          </div>

          {/* Price & Submit */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">{t('client.price.estimated')}</p>
                {pickup && dropoff ? (
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        calculatePrice(),
                        (settings?.currency || DEFAULT_SETTINGS.currency || 'USD').toUpperCase()
                      )}
                    </p>
                    {localCurrency && localRate && (
                      <p className="text-base font-semibold text-slate-700">
                        ≈ {formatCurrency(roundAmount(calculatePrice() * localRate, localCurrency), localCurrency)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-gray-400">--</p>
                )}
              </div>
              {pickup && dropoff && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t('client.price.distance')}</p>
                  <p className="font-semibold">
                    {Math.round(calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) * 10) / 10} km
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={createRide}
              disabled={!pickup || !dropoff || loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('client.price.creating')}</span>
                </div>
              ) : (
                t('client.price.request')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
