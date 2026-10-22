// Google Maps for the location picker, written to keep billable calls low:
//  - the script loads only when someone opens the map, never on page load (loadMaps);
//  - search waits for 3+ characters, runs in a session and caches each text (createSearchSession);
//  - turning a pin into an address is one call, only when an address form needs it, cached per ~11 m (reverseGeocode).
// Moving the map is free: the pin stays in the centre and we read the centre point.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// No key: the picker hides its map options and works on GPS / pincode as in phase 1.
export const mapsEnabled = Boolean(KEY);

// Used when there is no pin yet (Mohali). Zoomed out so the customer can find their area.
export const DEFAULT_CENTER = { lat: 30.7046, lng: 76.7179 };

let loading = null;

// Adds the Maps JavaScript API script once and resolves with `google.maps`.
// Every later call gets the same promise, so the script is never fetched twice.
export const loadMaps = () => {
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      window.__freshlyMapsReady = () => resolve(window.google.maps);
      // Google calls this when it rejects the key (wrong referrer, API not enabled, no billing).
      window.gm_authFailure = () => window.dispatchEvent(new Event("maps-auth-failure"));
      const params = new URLSearchParams({
        key: KEY,
        v: "weekly",
        loading: "async",
        callback: "__freshlyMapsReady",
        region: "IN",
        language: "en",
      });
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;
      script.onerror = () => {
        loading = null; // let a later open try again
        reject(new Error("Couldn't load Google Maps"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
};

const round6 = (value) => Number(Number(value).toFixed(6));

// Straight-line distance in metres between two { lat, lng } points.
export const distanceMeters = (a, b) => {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

// Places (New) returns { longText, types }, the Geocoder returns { long_name, types }; both map to our address fields.
export const toAddress = (components = [], lat, lng, formatted = "") => {
  const text = (...types) => {
    for (const type of types) {
      const found = components.find((component) => component.types.includes(type));
      if (found) return found.longText ?? found.long_name ?? "";
    }
    return "";
  };
  return {
    lat: round6(lat),
    lng: round6(lng),
    pincode: text("postal_code"),
    city: text("locality", "administrative_area_level_3", "administrative_area_level_2"),
    state: text("administrative_area_level_1"),
    area: [text("sublocality_level_1", "sublocality", "neighborhood"), text("route")].filter(Boolean).join(", "),
    formatted,
  };
};

// One search session: the suggestions typed for one place, ended by picking one (a Place Details call).
// Google bills the first 12 suggestion requests of a session one by one (the 13th onward are free),
// so the caller asks rarely (3+ characters, after a pause), and the cache means typing "sec", "sect",
// backspace, "sec" asks Google twice, not three times.
export const createSearchSession = async () => {
  const maps = await loadMaps();
  const { AutocompleteSessionToken, AutocompleteSuggestion } = await maps.importLibrary("places");
  const sessionToken = new AutocompleteSessionToken();
  const cache = new Map();

  return {
    // Place predictions for the text, biased to `near` (the map centre). Searches India only.
    async suggest(input, near) {
      const key = input.trim().toLowerCase();
      if (!cache.has(key)) {
        cache.set(key, AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken,
          includedRegionCodes: ["in"],
          language: "en-IN",
          ...(near && { locationBias: { center: near, radius: 30000 } }),
        })
          .then(({ suggestions }) => suggestions.map((suggestion) => suggestion.placePrediction).filter(Boolean))
          .catch((error) => {
            cache.delete(key);
            throw error;
          }));
      }
      return cache.get(key);
    },
    // Ends the session. Only Essentials fields, so it is billed at the cheapest Place Details rate.
    async resolve(prediction) {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress", "addressComponents"] });
      return toAddress(place.addressComponents, place.location.lat(), place.location.lng(), place.formattedAddress);
    },
  };
};

const geocoded = new Map();

// The address at a pin. 4 decimals is about 11 m, so moving the pin a little reuses the last answer.
export const reverseGeocode = ({ lat, lng }) => {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (!geocoded.has(key)) {
    geocoded.set(key, (async () => {
      const maps = await loadMaps();
      const { Geocoder } = await maps.importLibrary("geocoding");
      const { results } = await new Geocoder().geocode({ location: { lat, lng } });
      // The first result can be a plus code with no pincode; prefer one that has a pincode.
      const best = results.find((result) => result.address_components.some((c) => c.types.includes("postal_code"))) || results[0];
      return best ? toAddress(best.address_components, lat, lng, best.formatted_address) : null;
    })().catch((error) => {
      geocoded.delete(key);
      throw error;
    }));
  }
  return geocoded.get(key);
};
