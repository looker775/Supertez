export interface IpLocation {
  city?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
}

export interface LocationOverride extends IpLocation {
  updatedAt: number;
  source?: 'gps' | 'manual' | 'ip';
}

const LOCATION_OVERRIDE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

const IP_GEO_SOURCES = [
  'https://ipwho.is/',
  'https://ipapi.co/json/',
  'https://geolocation-db.com/json/',
];

const IP_GEO_TIMEOUT_MS = 3500;
const CITY_GEOCODE_TTL_MS = 1000 * 60 * 60 * 6;

const cityCenterCache = new Map<string, { lat: number; lng: number; city?: string; countryCode?: string; ts: number }>();

function normalizeCity(value?: string) {
  if (!value) return '';
  return value.trim().toLowerCase();
}

function parseIpLocation(data: any): IpLocation | undefined {
  if (!data || data?.success === false) return undefined;

  const city = data.city
    || data.region
    || data.region_name
    || data.state
    || data.province;

  const countryCode = data.country_code
    || data.countryCode
    || data.country_code_iso2
    || data.country;

  let latRaw = data.latitude ?? data.lat ?? data.location?.lat;
  let lngRaw = data.longitude ?? data.lon ?? data.lng ?? data.location?.lng;

  const locRaw = data.loc || data.location?.loc;
  if ((latRaw === undefined || lngRaw === undefined) && typeof locRaw === 'string' && locRaw.includes(',')) {
    const [latPart, lngPart] = locRaw.split(',');
    if (latRaw === undefined) latRaw = latPart;
    if (lngRaw === undefined) lngRaw = lngPart;
  }

  const lat = typeof latRaw === 'number' ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === 'number' ? lngRaw : Number(lngRaw);

  const location: IpLocation = {};
  if (typeof city === 'string' && city.trim()) location.city = city.trim();
  if (typeof countryCode === 'string' && countryCode.trim()) {
    location.countryCode = countryCode.trim().toUpperCase();
  }
  if (!Number.isNaN(lat)) location.lat = lat;
  if (!Number.isNaN(lng)) location.lng = lng;

  if (!location.city && !location.countryCode && location.lat === undefined && location.lng === undefined) {
    return undefined;
  }

  return location;
}

function coerceIpLocation(data: any): IpLocation | undefined {
  if (!data) return undefined;

  const hasDirect =
    typeof data.city === 'string' ||
    typeof data.countryCode === 'string' ||
    typeof data.country_code === 'string' ||
    typeof data.lat === 'number' ||
    typeof data.lng === 'number' ||
    typeof data.latitude === 'number' ||
    typeof data.longitude === 'number';

  if (hasDirect) {
    const parsed = parseIpLocation(data);
    if (parsed) return parsed;
  }

  return parseIpLocation(data);
}

async function fetchIpLocationFrom(url: string, timeoutMs = IP_GEO_TIMEOUT_MS): Promise<IpLocation | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return undefined;
    const data = await response.json();
    return coerceIpLocation(data);
  } catch {
    return undefined;
  }
}

function pickBestLocation(locations: IpLocation[]): IpLocation | undefined {
  if (!locations.length) return undefined;

  const cityCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();

  for (const loc of locations) {
    const cityKey = normalizeCity(loc.city);
    if (cityKey) {
      cityCounts.set(cityKey, (cityCounts.get(cityKey) || 0) + 1);
    }
    const cc = loc.countryCode?.toUpperCase();
    if (cc) {
      countryCounts.set(cc, (countryCounts.get(cc) || 0) + 1);
    }
  }

  const bestCityKey = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestCountry = [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  let bestCity: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;

  if (bestCityKey) {
    const match = locations.find((loc) => normalizeCity(loc.city) === bestCityKey);
    bestCity = match?.city;
    if (match?.lat !== undefined && match?.lng !== undefined) {
      lat = match.lat;
      lng = match.lng;
    }
  }

  if (lat === undefined || lng === undefined) {
    const latValues = locations.map((loc) => loc.lat).filter((v): v is number => typeof v === 'number');
    const lngValues = locations.map((loc) => loc.lng).filter((v): v is number => typeof v === 'number');
    if (latValues.length && lngValues.length) {
      lat = latValues.reduce((a, b) => a + b, 0) / latValues.length;
      lng = lngValues.reduce((a, b) => a + b, 0) / lngValues.length;
    }
  }

  if (!bestCity && lat === undefined && lng === undefined && !bestCountry) return undefined;

  return {
    city: bestCity,
    countryCode: bestCountry,
    lat,
    lng,
  };
}

export async function detectLocationFromIp(): Promise<IpLocation | undefined> {
  const candidates: IpLocation[] = [];

  const serverLocation = await fetchIpLocationFrom('/.netlify/functions/ip-geo', 2500);
  if (serverLocation) candidates.push(serverLocation);

  const results = await Promise.all(IP_GEO_SOURCES.map((url) => fetchIpLocationFrom(url)));
  for (const result of results) {
    if (result) candidates.push(result);
  }

  return pickBestLocation(candidates);
}

export async function detectCountryCode(): Promise<string | undefined> {
  const location = await detectLocationFromIp();
  return location?.countryCode;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function geocodeCityCenter(city: string, countryCode?: string): Promise<IpLocation | null> {
  if (!city) return null;
  const cacheKey = `${city.toLowerCase()}|${countryCode || ''}`;
  const cached = cityCenterCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CITY_GEOCODE_TTL_MS) {
    return {
      city: cached.city,
      countryCode: cached.countryCode,
      lat: cached.lat,
      lng: cached.lng,
    };
  }

  try {
    const query = countryCode ? `${city}, ${countryCode}` : city;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const item = data[0];
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    const cityName = item.address?.city
      || item.address?.town
      || item.address?.village
      || item.address?.state
      || city;
    const cc = item.address?.country_code
      ? String(item.address.country_code).toUpperCase()
      : countryCode;

    cityCenterCache.set(cacheKey, {
      lat,
      lng,
      city: cityName,
      countryCode: cc,
      ts: Date.now(),
    });

    return {
      city: cityName,
      countryCode: cc,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export function readLocationOverride(key: string, ttlMs: number = LOCATION_OVERRIDE_TTL_MS): LocationOverride | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationOverride;
    const updatedAt = Number(parsed?.updatedAt);
    if (!updatedAt || Number.isNaN(updatedAt)) return null;
    if (Date.now() - updatedAt > ttlMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocationOverride(key: string, payload: LocationOverride) {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}
