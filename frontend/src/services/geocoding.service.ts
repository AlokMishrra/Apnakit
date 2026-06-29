/**
 * Geocoding service using OpenStreetMap Nominatim API.
 * Free, no API key required.
 * https://nominatim.org/release-docs/develop/api/Overview/
 */

export interface ReverseGeocodeResult {
  city: string;
  state: string;
  country: string;
  displayName: string;
}

/**
 * Reverse geocode lat/lng to a real city/state name.
 * Returns null if the location could not be resolved.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    // Nominatim usage policy requires a User-Agent header
    // Browser fetch doesn't allow setting User-Agent, but Accept-Language
    // is the equivalent for browser-based usage.
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;

    const a = data.address || {};
    // City can come from many fields depending on location type
    const city =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.county ||
      a.state_district ||
      a.suburb ||
      data.name ||
      "";
    const state = a.state || a.region || "";
    const country = a.country || "";
    const displayName = data.display_name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;

    if (!city) {
      // Fall back to displayName's first part
      const firstPart = displayName.split(",")[0]?.trim();
      if (firstPart) {
        return {
          city: firstPart,
          state,
          country,
          displayName,
        };
      }
      return null;
    }

    return { city, state, country, displayName };
  } catch {
    return null;
  }
}

/**
 * IP-based geolocation fallback using a free API.
 * Returns approximate city based on the user's IP address.
 */
export async function ipGeolocation(): Promise<ReverseGeocodeResult | null> {
  try {
    // ipapi.co free tier (no key, 30k req/month)
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const city = data.city;
    const state = data.region;
    const country = data.country_name || data.country || "";
    if (!city) return null;
    return {
      city,
      state: state || "",
      country,
      displayName: [city, state, country].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}
