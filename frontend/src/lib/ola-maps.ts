/**
 * Thin client for Ola Maps' Places Autocomplete + Geocoding APIs, used to
 * let users type a place name/address and resolve it to lat/lng without
 * ever seeing raw coordinates themselves.
 *
 * Docs: https://maps.olakrutrim.com/docs
 */
const OLA_MAPS_BASE_URL = "https://api.olamaps.io";
const OLA_MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY ?? "";

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  lat: number;
  lng: number;
}

interface OlaAutocompletePrediction {
  place_id: string;
  description: string;
  geometry?: { location?: { lat: number; lng: number } };
}

interface OlaAutocompleteResponse {
  predictions?: OlaAutocompletePrediction[];
}

/**
 * Fetch place suggestions for a partial address/place name. Returns an
 * empty array (rather than throwing) on failure so a flaky map API call
 * never blocks the rest of the form.
 */
export async function fetchPlaceSuggestions(query: string): Promise<PlaceSuggestion[]> {
  if (!query.trim() || !OLA_MAPS_API_KEY) return [];

  try {
    const url = new URL(`${OLA_MAPS_BASE_URL}/places/v1/autocomplete`);
    url.searchParams.set("input", query);
    url.searchParams.set("api_key", OLA_MAPS_API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data: OlaAutocompleteResponse = await res.json();
    return (data.predictions ?? [])
      .filter((p) => p.geometry?.location)
      .map((p) => ({
        placeId: p.place_id,
        description: p.description,
        lat: p.geometry!.location!.lat,
        lng: p.geometry!.location!.lng,
      }));
  } catch {
    return [];
  }
}
