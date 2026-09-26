import { ExternalLink, MapPin } from "lucide-react";
import FormField from "@/components/dashboard/FormField";
import { inputClass } from "@/lib/formStyles";
import { zoneCoverage, zoneOptionLabel } from "@/lib/warehouseStatus";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

// Address, delivery zone and map pin. Shared by the Add warehouse "Location" step
// and the warehouse detail "Location" tab.
const WarehouseLocationFields = ({ form, errors = {}, onChange, zones = [], idPrefix = "loc" }) => {
  const zone = zones.find((item) => String(item.id) === String(form.zone_id));
  const hasPin = form.latitude !== "" && form.longitude !== "" && Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));
  const field = (name) => ({
    id: `${idPrefix}-${name}`,
    value: form[name],
    onChange: (event) => onChange(name, event.target.value),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${idPrefix}-${name}-error` : undefined,
    className: inputClass,
  });

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <div className="flex flex-col gap-3.5">
        <FormField id={`${idPrefix}-address`} label="Address line" error={errors.address}>
          <input type="text" autoComplete="street-address" {...field("address")} />
        </FormField>
        <div className="grid grid-cols-2 gap-3.5">
          <FormField id={`${idPrefix}-city`} label="City" error={errors.city}>
            <input type="text" autoComplete="address-level2" {...field("city")} />
          </FormField>
          <FormField id={`${idPrefix}-pincode`} label="Pincode" error={errors.pincode}>
            <input type="text" inputMode="numeric" maxLength={6} autoComplete="postal-code" {...field("pincode")} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <FormField id={`${idPrefix}-state`} label="State" error={errors.state}>
            <input type="text" list={`${idPrefix}-states`} autoComplete="address-level1" {...field("state")} />
            <datalist id={`${idPrefix}-states`}>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state} />
              ))}
            </datalist>
          </FormField>
          <FormField id={`${idPrefix}-country`} label="Country" error={errors.country}>
            <input type="text" autoComplete="country-name" {...field("country")} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <FormField id={`${idPrefix}-zone_id`} label="Delivery zone" error={errors.zone_id}>
            <select {...field("zone_id")}>
              <option value="">Pick a zone</option>
              {zones.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {zoneOptionLabel(item)}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-semibold text-foreground">Zone coverage</span>
            <span className="flex h-12 items-center rounded-xl bg-muted px-3.5 text-sm text-muted-foreground">
              {zoneCoverage(zone)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* No map library in this project yet: a static preview plus a link to check the pin on Google Maps. */}
        <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-[14px] border border-border bg-secondary bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px]">
          <span className="absolute left-3 top-3 rounded-[10px] bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
            {hasPin ? "Pin set from the coordinates below" : "Enter the store entrance coordinates"}
          </span>
          <MapPin className={`h-10 w-10 ${hasPin ? "fill-primary/20 text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
          {hasPin && (
            <a
              href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[10px] bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm hover:bg-secondary"
            >
              Check on Google Maps
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <FormField id={`${idPrefix}-latitude`} label="Latitude" error={errors.latitude}>
            <input type="text" inputMode="decimal" {...field("latitude")} />
          </FormField>
          <FormField id={`${idPrefix}-longitude`} label="Longitude" error={errors.longitude}>
            <input type="text" inputMode="decimal" {...field("longitude")} />
          </FormField>
        </div>
      </div>
    </div>
  );
};

export default WarehouseLocationFields;
