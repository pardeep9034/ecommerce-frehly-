import { useEffect, useState } from "react";
import FormField from "@/components/dashboard/FormField";
import ReadOnlyNote from "@/components/dashboard/ReadOnlyNote";
import { useWarehouseSettings } from "@/hooks/use-warehouse";
import { VIEW_ONLY_HINT } from "@/lib/warehouseAccess";
import { warehouseStatus } from "@/lib/warehouseStatus";
import { formFromWarehouse, settingsPayload, validateOperations } from "@/lib/warehouseForm";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

const STORE_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "PAUSED", label: "Pause orders" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const PAUSE_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "MANUAL", label: "Until I turn it back on" },
];

const reopensAt = (minutes) =>
  new Date(Date.now() + Number(minutes) * 60000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const settingsFromWarehouse = (warehouse) => ({
  ...formFromWarehouse(warehouse),
  // A draft or deactivated store has no day-to-day status yet; the picker starts on Open.
  operational_status: STORE_STATUS_OPTIONS.some((option) => option.value === warehouse?.operational_status)
    ? warehouse.operational_status
    : "OPEN",
  pause_minutes: "30",
  pause_reason: warehouse?.pause_reason ?? "",
  maintenance_message: warehouse?.maintenance_message ?? "",
});

// Store status (open / pause / maintenance) and operations (hours, pack-by). Shared by the warehouse detail
// "Settings" tab and the store console Settings page. `access` comes from warehouseAccess(warehouse.id).
const WarehouseSettingsForm = ({ warehouse, access }) => {
  const [form, setForm] = useState(() => settingsFromWarehouse(warehouse));
  const [errors, setErrors] = useState({});
  const { updateSettingsMutation } = useWarehouseSettings(String(warehouse.id));
  const readOnly = !access.manages;
  const status = warehouseStatus(warehouse);

  useEffect(() => {
    setForm(settingsFromWarehouse(warehouse));
  }, [warehouse]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, store_hours: undefined }));
  };
  const resetForm = () => {
    setForm(settingsFromWarehouse(warehouse));
    setErrors({});
  };

  // The pause and maintenance fields are cleared whenever the status they belong to isn't the one being saved.
  // A draft keeps SETTING_UP (sending OPEN would turn it into a deactivated store): it goes live from Continue setup.
  const saveSettings = () => {
    const found = validateOperations(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (status === "DRAFT") {
      updateSettingsMutation.mutate(settingsPayload(form));
      return;
    }
    const paused = form.operational_status === "PAUSED";
    updateSettingsMutation.mutate({
      ...settingsPayload(form),
      operational_status: form.operational_status,
      pause_reason: paused ? form.pause_reason.trim() || null : null,
      paused_until:
        paused && form.pause_minutes !== "MANUAL" ? new Date(Date.now() + Number(form.pause_minutes) * 60000).toISOString() : null,
      maintenance_message: form.operational_status === "MAINTENANCE" ? form.maintenance_message.trim() || null : null,
    });
  };

  return (
    <>
      {readOnly && <ReadOnlyNote>{VIEW_ONLY_HINT}</ReadOnlyNote>}
      <fieldset disabled={readOnly} className="contents">
      {status !== "DRAFT" && (
      <section className={cardClass}>
        <h2 className="font-display text-base font-bold text-foreground">Store status</h2>
        <div role="radiogroup" aria-label="Store status" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {STORE_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={form.operational_status === option.value}
              onClick={() => setField("operational_status", option.value)}
              className={`h-10 rounded-lg text-sm transition-colors ${
                form.operational_status === option.value ? "bg-white font-bold text-foreground shadow-sm" : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {form.operational_status === "PAUSED" && (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">Pause for</span>
              <div className="flex flex-wrap gap-2">
                {PAUSE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={form.pause_minutes === option.value}
                    onClick={() => setField("pause_minutes", option.value)}
                    className={`h-10 rounded-xl border-[1.5px] px-4 text-sm font-semibold ${
                      form.pause_minutes === option.value ? "border-primary bg-secondary text-primary" : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <FormField id="pause-reason" label="Reason (customers see this)">
              <input id="pause-reason" value={form.pause_reason} onChange={(event) => setField("pause_reason", event.target.value)} placeholder="Too many orders right now" className={inputClass} />
            </FormField>
            <p className="text-[13px] text-muted-foreground">
              {form.pause_minutes === "MANUAL" ? "Stays paused until you switch it back to Open." : `Reopens at ${reopensAt(form.pause_minutes)}.`}
            </p>
          </div>
        )}
        {form.operational_status === "MAINTENANCE" && (
          <FormField id="maint-message" label="Message for customers">
            <input id="maint-message" value={form.maintenance_message} onChange={(event) => setField("maintenance_message", event.target.value)} placeholder="Closed for maintenance, back tomorrow at 6 AM" className={inputClass} />
          </FormField>
        )}
      </section>
      )}

      <section className={cardClass}>
        <h2 className="font-display text-base font-bold text-foreground">Operations</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1.6fr_1fr]">
          <FormField id="set-open" label="Store hours" hint="Empty = open all day · closing before opening runs past midnight" error={errors.store_hours}>
            <div className="flex items-center gap-2">
              <input id="set-open" aria-label="Opens at" type="time" value={form.store_open_time} onChange={(event) => setField("store_open_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
              <span aria-hidden="true">–</span>
              <input aria-label="Closes at" type="time" value={form.store_close_time} onChange={(event) => setField("store_close_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
            </div>
          </FormField>
          <FormField id="set-packby" label="Pack-by target (min)" error={errors.pack_by_minutes}>
            <input id="set-packby" type="number" min={1} value={form.pack_by_minutes} onChange={(event) => setField("pack_by_minutes", event.target.value)} className={inputClass} />
          </FormField>
        </div>
      </section>
      </fieldset>

      {!readOnly && (
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={resetForm} className={secondaryButtonClass}>Cancel</button>
          <button type="button" onClick={saveSettings} disabled={updateSettingsMutation.isPending} className={primaryButtonClass}>
            {updateSettingsMutation.isPending ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </>
  );
};

export default WarehouseSettingsForm;
