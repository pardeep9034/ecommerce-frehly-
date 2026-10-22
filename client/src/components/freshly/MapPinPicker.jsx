import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { DEFAULT_CENTER, createSearchSession, distanceMeters, loadMaps } from "@/lib/googleMaps";
import { getCurrentPoint } from "@/lib/geolocation";
import { notify } from "@/lib/notify";

// A searched place still counts as "where the pin is" if the pin moved less than this.
const SAME_PLACE_M = 30;

// Full-screen map with a pin fixed in the centre: the customer drags the map under it.
// The parent keeps this mounted after the first open, so one map (one billable map load)
// serves every later open in the tab. onConfirm gets { lat, lng, address } where address
// is the searched place when the pin is still on it, else null (the parent geocodes only if it must).
const MapPinPicker = ({ open, start, title, confirmLabel, onConfirm, onClose }) => {
  const mapDiv = useRef(null);
  const map = useRef(null);
  const center = useRef(start || DEFAULT_CENTER);
  const session = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const place = useRef(null); // address of the last searched place
  const [onPlace, setOnPlace] = useState(false); // is the pin still on it?
  const [locating, setLocating] = useState(false);

  // Create the map on the first open only.
  useEffect(() => {
    if (!open || map.current) return undefined;
    let cancelled = false;
    loadMaps()
      .then((maps) => maps.importLibrary("maps"))
      .then(({ Map }) => {
        if (cancelled) return;
        map.current = new Map(mapDiv.current, {
          center: center.current,
          zoom: start ? 17 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        // "idle" fires once the map stops moving. Reading the centre is free.
        map.current.addListener("idle", () => {
          const point = map.current.getCenter();
          center.current = { lat: point.lat(), lng: point.lng() };
          setOnPlace(Boolean(place.current) && distanceMeters(center.current, place.current) < SAME_PLACE_M);
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    const authFailed = () => setStatus("error");
    window.addEventListener("maps-auth-failure", authFailed);
    return () => {
      cancelled = true;
      window.removeEventListener("maps-auth-failure", authFailed);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- start is read when the map is made

  // Later opens: move the kept map to the new starting point (numbers as deps: `start` is a new object each render).
  const startLat = start?.lat;
  const startLng = start?.lng;
  useEffect(() => {
    if (open && map.current && startLat != null) {
      map.current.panTo({ lat: startLat, lng: startLng });
      map.current.setZoom(17);
    }
  }, [open, startLat, startLng]);

  // Ask Google only after a pause in typing and for 3+ characters.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
      setSuggestions([]);
      return undefined;
    }
    let stale = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        session.current ??= createSearchSession();
        const found = await (await session.current).suggest(text, center.current);
        if (!stale) setSuggestions(found);
      } catch {
        if (!stale) setSuggestions([]);
      } finally {
        if (!stale) setSearching(false);
      }
    }, 400);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  const choosePlace = async (prediction) => {
    setSuggestions([]);
    setQuery("");
    try {
      const address = await (await session.current).resolve(prediction);
      session.current = null; // the next search is a new session
      place.current = address;
      setOnPlace(true);
      center.current = { lat: address.lat, lng: address.lng };
      map.current?.panTo(center.current);
      map.current?.setZoom(17);
    } catch {
      notify.error("Couldn't open that place. Try another one.");
    }
  };

  const locateMe = async () => {
    setLocating(true);
    try {
      const point = await getCurrentPoint(); // the browser's GPS, not a Google call
      map.current?.panTo(point);
      map.current?.setZoom(17);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    const point = { lat: Number(center.current.lat.toFixed(6)), lng: Number(center.current.lng.toFixed(6)) };
    onConfirm({ ...point, address: onPlace && place.current ? { ...place.current, ...point } : null });
  };

  return (
    <div className={`${open ? "flex" : "hidden"} fixed inset-0 z-60 items-center justify-center sm:bg-slate-900/60`}>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      className="flex h-full w-full flex-col bg-white sm:h-[min(720px,90vh)] sm:w-[min(560px,95vw)] sm:overflow-hidden sm:rounded-3xl sm:shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3">
        <button type="button" onClick={onClose} aria-label="Back" className="rounded-full p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-black text-slate-900">{title}</h2>
      </div>

      <div className="relative px-3 pt-3">
        <label htmlFor="map-search" className="sr-only">Search for an area or street</label>
        <Search className="pointer-events-none absolute left-6 top-1/2 mt-1.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="map-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search area, street, society…"
          autoComplete="off"
          disabled={status !== "ready"}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm font-semibold outline-none focus:border-primary focus:bg-white"
        />
        {searching && <Loader2 className="absolute right-6 top-1/2 mt-1.5 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
        {suggestions.length > 0 && (
          <ul className="absolute inset-x-3 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl">
            {suggestions.map((prediction) => (
              <li key={prediction.placeId}>
                <button
                  type="button"
                  onClick={() => choosePlace(prediction)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-bold text-slate-900">{prediction.mainText?.text ?? prediction.text.text}</span>
                    <span className="block truncate text-xs text-slate-500">{prediction.secondaryText?.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative mt-3 flex-1">
        <div ref={mapDiv} className="absolute inset-0 bg-slate-100" />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {status === "error" && (
          <p className="absolute inset-x-6 top-1/3 rounded-2xl bg-orange-50 p-4 text-center text-sm font-bold text-orange-700">
            The map isn't available right now. Go back and use your current location or pincode.
          </p>
        )}
        {status === "ready" && (
          <>
            {/* The pin's tip sits on the map centre. */}
            <MapPin
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-full fill-primary text-white drop-shadow-lg"
            />
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/30 bg-white px-4 py-2 text-xs font-black text-primary shadow-lg disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Use current location
            </button>
          </>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p className="text-sm text-slate-600">
          {onPlace && place.current ? (
            <span className="font-bold text-slate-900">{place.current.formatted}</span>
          ) : (
            "Move the map so the pin sits on your door."
          )}
        </p>
        <button
          type="button"
          onClick={confirm}
          disabled={status !== "ready"}
          className="h-12 w-full rounded-2xl bg-primary text-sm font-black text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
    </div>
  );
};

export default MapPinPicker;
