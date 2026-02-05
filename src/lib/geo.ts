export interface IpLocation {
  city?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
}

const IP_GEO_SOURCES = [
  'https://ipapi.co/json/',
  'https://ipwho.is/',
  'https://ipinfo.io/json',
];

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

export async function detectLocationFromIp(): Promise<IpLocation | undefined> {
  for (const url of IP_GEO_SOURCES) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) continue;
      const data = await response.json();
      const parsed = parseIpLocation(data);
      if (parsed) return parsed;
    } catch {
      // ignore and try next provider
    }
  }

  return undefined;
}

export async function detectCountryCode(): Promise<string | undefined> {
  const location = await detectLocationFromIp();
  return location?.countryCode;
}
