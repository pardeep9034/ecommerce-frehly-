import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import useAddress from "@/hooks/use-address";
import useDeliveryLocation, { locationLabel } from "@/hooks/use-deliveryLocation";
import { closeLocationPicker, openLocationPicker } from "@/redux/locationSlice";
import { getCurrentPoint } from "@/lib/geolocation";
import { mapsEnabled, reverseGeocode } from "@/lib/googleMaps";
import { getToken } from "@/lib/tokenStorage";
import { notify } from "@/lib/notify";
import AddressFormModal from "./AddressFormModal";
import MapPinPicker from "./MapPinPicker";

const TITLE = "Select delivery location";
const DESCRIPTION = "We'll show what your nearest store can deliver.";

// Rendered once in PublicLayout. Opened by the Navbar chip, by add-to-cart without a location, and on a first visit.
const LocationPicker = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const open = useSelector((state) => state.location.pickerOpen);
  const { location, choose } = useDeliveryLocation();
  const { addresses, isLoading: addressesLoading } = useAddress();
  const loggedIn = Boolean(getToken());
  const [pincode, setPincode] = useState("");
  const [locating, setLocating] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressPrefill, setAddressPrefill] = useState(null);
  // "location" = set where to deliver, "address" = pin a new address; null = map closed.
  const [mapFor, setMapFor] = useState(null);
  const [mapMounted, setMapMounted] = useState(false); // kept after the first open: one map load per tab
  const autoStarted = useRef(false);
  const busy = locating || choose.isPending;

  // First visit: a logged-in customer starts at their default address, anyone else is asked.
  useEffect(() => {
    if (location || autoStarted.current || (loggedIn && addressesLoading)) return;
    autoStarted.current = true;
    const preferred = addresses?.find((address) => address.is_default);
    if (preferred) choose.mutate({ address: preferred });
    else dispatch(openLocationPicker());
  }, [location, loggedIn, addressesLoading, addresses]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close once a store serves the place; otherwise stay open (or reopen) with the "not here yet" note.
  const pick = (input) =>
    choose.mutate(input, {
      onSuccess: (next) => dispatch(next.serviceable ? closeLocationPicker() : openLocationPicker()),
    });

  const locateMe = async () => {
    setLocating(true);
    try {
      pick(await getCurrentPoint());
    } catch (error) {
      notify.error(error.message);
    } finally {
      setLocating(false);
    }
  };

  const submitPincode = (event) => {
    event.preventDefault();
    if (/^\d{6}$/.test(pincode)) pick({ pincode });
  };

  // The address form and the map are their own overlays; the dialog's focus trap would block them, so the picker steps aside.
  const openMap = (purpose) => {
    dispatch(closeLocationPicker());
    setMapMounted(true);
    setMapFor(purpose);
  };

  const addAddress = () => {
    if (mapsEnabled) return openMap("address"); // pin first, then the details, like other delivery apps
    dispatch(closeLocationPicker());
    setAddressPrefill(pincode.length === 6 ? { postal_code: pincode } : location?.pincode ? { postal_code: location.pincode } : null);
    setAddressFormOpen(true);
  };

  // Zones match a pin by radius, so "deliver here" needs no Google call. Only when the pin is outside
  // every radius and we have no pincode do we geocode once, in case a zone lists the pin's pincode.
  const deliverToPin = ({ lat, lng, address }) =>
    choose.mutate({ lat, lng, pincode: address?.pincode || undefined }, {
      onSuccess: async (next) => {
        if (next.serviceable || address?.pincode) {
          dispatch(next.serviceable ? closeLocationPicker() : openLocationPicker());
          return;
        }
        const found = await reverseGeocode({ lat, lng }).catch(() => null);
        if (found?.pincode) pick({ lat, lng, pincode: found.pincode });
        else dispatch(openLocationPicker());
      },
    });

  // A new address needs pincode / city / state: from the searched place if the pin is still on it, else one geocode.
  const addressAtPin = async ({ lat, lng, address }) => {
    const found = address || (await reverseGeocode({ lat, lng }).catch(() => null));
    setAddressPrefill({
      latitude: lat,
      longitude: lng,
      ...(found && {
        postal_code: found.pincode,
        city: found.city,
        state: found.state,
        address_line_2: found.area,
      }),
    });
    setAddressFormOpen(true);
  };

  const confirmMap = (pin) => {
    const purpose = mapFor;
    setMapFor(null);
    if (purpose === "address") addressAtPin(pin);
    else deliverToPin(pin);
  };

  const closeMap = () => {
    setMapFor(null);
    dispatch(openLocationPicker());
  };

  const onOpenChange = (next) => dispatch(next ? openLocationPicker() : closeLocationPicker());
  const missed = choose.data && !choose.data.serviceable;

  const body = (
    <div className="max-h-[65vh] space-y-5 overflow-y-auto px-4 pb-6 sm:px-0 sm:pb-0">
      <button
        type="button"
        onClick={locateMe}
        disabled={busy}
        className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-left text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        {locating ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <LocateFixed className="h-5 w-5 shrink-0" />}
        <span>
          Use my current location
          <span className="block text-xs font-medium text-slate-500">Your browser will ask for permission</span>
        </span>
      </button>

      {mapsEnabled && (
        <button
          type="button"
          onClick={() => openMap("location")}
          disabled={busy}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-900 transition-colors hover:border-primary disabled:opacity-60"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <span>
            Search area or set on map
            <span className="block text-xs font-medium text-slate-500">Drag the map to your exact spot</span>
          </span>
        </button>
      )}

      <form onSubmit={submitPincode} className="flex gap-2">
        <label htmlFor="location-pincode" className="sr-only">Pincode</label>
        <input
          id="location-pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
          placeholder="Enter 6-digit pincode"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="submit"
          disabled={busy || pincode.length !== 6}
          className="rounded-2xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {choose.isPending && !locating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
        </button>
      </form>

      {missed && (
        <p role="alert" className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
          We don't deliver to {locationLabel(choose.data)} yet. Try another pincode or address.
        </p>
      )}

      {loggedIn && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Saved addresses</p>
          {addressesLoading && <div className="h-14 rounded-2xl skeleton-shimmer" />}
          <ul className="space-y-2">
            {addresses?.map((address) => (
              <li key={address.id}>
                <button
                  type="button"
                  onClick={() => pick({ address })}
                  disabled={busy}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors hover:border-primary disabled:opacity-60 ${
                    location?.address_id === address.id ? "border-primary bg-primary/5" : "border-slate-200"
                  }`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 text-sm">
                    <span className="font-black text-slate-900">{address.address_type}</span>
                    <span className="block truncate text-slate-500">
                      {address.address_line_1}, {address.city} - {address.postal_code}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addAddress}
            className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add new address
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{TITLE}</DrawerTitle>
              <DrawerDescription>{DESCRIPTION}</DrawerDescription>
            </DrawerHeader>
            {body}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{TITLE}</DialogTitle>
              <DialogDescription>{DESCRIPTION}</DialogDescription>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      )}
      {mapMounted && (
        <MapPinPicker
          open={Boolean(mapFor)}
          start={location?.lat != null ? { lat: location.lat, lng: location.lng } : null}
          title={mapFor === "address" ? "Pin your new address" : "Set delivery location"}
          confirmLabel={mapFor === "address" ? "Confirm & add details" : "Deliver here"}
          onConfirm={confirmMap}
          onClose={closeMap}
        />
      )}
      <AddressFormModal
        isOpen={addressFormOpen}
        onClose={() => setAddressFormOpen(false)}
        initialData={null}
        prefill={addressPrefill ?? undefined}
        onSaved={(address) => address?.id && pick({ address })}
      />
    </>
  );
};

// Full-width note under the navbar while the chosen location has no store.
export const NotServiceableBanner = () => {
  const dispatch = useDispatch();
  const location = useSelector((state) => state.location.current);
  if (!location || location.serviceable) return null;

  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-orange-50 px-4 py-3 text-center text-sm font-bold text-orange-700">
      <span>We're not in {locationLabel(location)} yet, so you can browse but not order.</span>
      <button
        type="button"
        onClick={() => dispatch(openLocationPicker())}
        className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-700"
      >
        Change location
      </button>
    </div>
  );
};

export default LocationPicker;
