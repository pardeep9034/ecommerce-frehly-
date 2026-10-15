import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, CircleDashed, Info, Rocket, X } from "lucide-react";
import FormField from "@/components/dashboard/FormField";
import StaffCheckRow from "@/components/dashboard/StaffCheckRow";
import StatusPill from "@/components/dashboard/StatusPill";
import DemoBadge from "@/components/dashboard/DemoBadge";
import WarehouseLocationFields from "@/components/dashboard/WarehouseLocationFields";
import { Switch } from "@/components/ui/switch";
import warehouseApi from "@/apis/warehouseApi";
import useWarehouse, { useWarehouseDetail } from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import useStaff from "@/hooks/use-staff";
import { notify } from "@/lib/notify";
import { isApiMissing } from "@/lib/demoData";
import { assignmentMeta, fullName } from "@/lib/staffRole";
import { WAREHOUSE_STATUS } from "@/lib/warehouseStatus";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";
import {
  EMPTY_WAREHOUSE_FORM,
  formFromWarehouse,
  settingsPayload,
  validateBasics,
  validateLocation,
  validateOperations,
  warehousePayload,
} from "@/lib/warehouseForm";

const STEPS = [
  { key: "basics", label: "Basics", validate: validateBasics },
  { key: "location", label: "Location", validate: validateLocation },
  { key: "ops", label: "Operations", validate: validateOperations },
  { key: "team", label: "Team", validate: () => ({}) },
];

const DRAFT_PILL = { ...WAREHOUSE_STATUS.DRAFT, label: "Draft · not live" };

const WarehouseNewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_WAREHOUSE_FORM);
  const [errors, setErrors] = useState({});
  const [newRack, setNewRack] = useState("");
  const [managerId, setManagerId] = useState("");
  const [opsIds, setOpsIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const { warehouse: draft } = useWarehouseDetail(draftId);
  const { createMutation, updateMutation } = useWarehouse();
  const { deliveryZonesData } = useDeliveryZone(1, 100);
  const { allStaff, isDemo: staffIsDemo } = useStaff(1, 100);
  const zones = deliveryZonesData?.data?.deliveryZones ?? [];

  useEffect(() => {
    if (draft) setForm(formFromWarehouse(draft));
  }, [draft]);

  const admins = allStaff.filter((user) => user.role === "ADMIN" && user.is_active);
  const opsStaff = allStaff.filter((user) => user.role === "OPS_STAFF" && user.is_active);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, store_hours: undefined }));
  };

  const checklist = useMemo(() => {
    const locationOk = Object.keys(validateLocation(form)).length === 0;
    return [
      { label: "Name and code", done: Boolean(form.name.trim() && form.code.trim()) },
      { label: "Map pin inside a delivery zone", done: locationOk },
      { label: "Store hours and racks", done: Boolean(form.store_open_time && form.store_close_time && form.racks.length) },
      { label: "A store manager assigned", done: Boolean(managerId) },
      { label: "Stock added in Inventory", done: false, link: "/dashboard/inventory" },
    ];
  }, [form, managerId]);

  // Validates steps [0..upTo]; jumps to the first step with a problem. `quiet` skips
  // the error messages (step-bar jumps shouldn’t flag fields the user hasn’t reached).
  const validateThrough = (upTo, quiet = false) => {
    for (let index = 0; index <= upTo; index += 1) {
      const stepErrors = STEPS[index].validate(form);
      if (Object.keys(stepErrors).length) {
        setErrors(quiet && index > step ? {} : stepErrors);
        setStep(index);
        return false;
      }
    }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (validateThrough(step)) setStep(step + 1);
  };

  const addRack = () => {
    const label = newRack.trim().toUpperCase();
    if (!label) return;
    if (!form.racks.includes(label)) setField("racks", [...form.racks, label]);
    setNewRack("");
  };

  // Hours, racks and team go to endpoints that don't exist yet; the warehouse
  // itself is saved either way, so a missing endpoint only earns a warning.
  const saveExtras = async (warehouseId, live) => {
    const teamIds = [managerId, ...opsIds].filter((id) => id && Number(id) > 0);
    const results = await Promise.allSettled([
      warehouseApi.updateWarehouseSettings(warehouseId, { ...settingsPayload(form), operational_status: live ? "OPEN" : undefined }),
      ...teamIds.map((userId) => warehouseApi.assignWarehouseStaff(warehouseId, Number(userId))),
    ]);
    const failures = results.filter((result) => result.status === "rejected").map((result) => result.reason);
    if (failures.some(isApiMissing) || (staffIsDemo && (managerId || opsIds.length))) {
      notify.warning("Warehouse saved. Store hours, racks and team need the backend API before they’re stored.");
    } else if (failures.length) {
      notify.apiError(failures[0], "Warehouse saved, but its settings or team failed to save");
    }
  };

  const save = async (live) => {
    // The backend needs name, code, zone and coordinates even for a draft.
    if (!validateThrough(live ? STEPS.length - 1 : 1)) return;
    if (live && !managerId) {
      setErrors({ managerId: "Pick a store manager before going live" });
      setStep(3);
      return;
    }

    setIsSaving(true);
    try {
      const payload = warehousePayload(form);
      let warehouseId = draftId;
      if (draftId) {
        await updateMutation.mutateAsync({ id: draftId, data: { ...payload, is_active: live } });
      } else {
        // The create schema types is_active as a string; omit it to get the model's default (true).
        const response = await createMutation.mutateAsync(live ? payload : { ...payload, is_active: "false" });
        warehouseId = response?.data?.id;
      }
      if (warehouseId) await saveExtras(warehouseId, live);
      navigate(live && warehouseId ? `/dashboard/warehouses/${warehouseId}` : "/dashboard/warehouses");
    } catch {
      // The mutation's onError already showed the reason.
    } finally {
      setIsSaving(false);
    }
  };

  const current = STEPS[step].key;
  const title = form.name.trim() || "Untitled";

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/dashboard/warehouses" className="font-medium hover:text-foreground">
          Warehouses
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-foreground">{draftId ? "Finish setup" : "New"}</span>
      </nav>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white px-5 py-[18px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="flex-1 font-display text-xl font-bold text-foreground">
                {draftId ? "Finish setup" : "New warehouse"} · {title}
              </h2>
              <StatusPill config={DRAFT_PILL} />
            </div>
            <ol aria-label="Setup steps" className="m-0 flex list-none gap-2.5 p-0">
              {STEPS.map((item, index) => (
                <li key={item.key} className="flex flex-1">
                  <button
                    type="button"
                    aria-current={index === step ? "step" : undefined}
                    onClick={() => (index <= step || validateThrough(index - 1, true) ? setStep(index) : null)}
                    className={`flex flex-1 flex-col gap-2 text-left text-[13px] ${
                      index === step
                        ? "font-bold text-foreground"
                        : index < step
                          ? "font-semibold text-primary"
                          : "font-medium text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`block h-1 rounded ${index < step ? "bg-primary" : index === step ? "bg-accent" : "bg-border"}`}
                      aria-hidden="true"
                    />
                    {index + 1} · {item.label}
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {current === "basics" && (
            <section className={cardClass}>
              <h2 className="font-display text-base font-bold text-foreground">Basics</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <FormField id="wh-name" label="Warehouse name" error={errors.name}>
                  <input id="wh-name" type="text" value={form.name} onChange={(event) => setField("name", event.target.value)} aria-invalid={Boolean(errors.name)} placeholder="Dark Store · Kharar" className={inputClass} />
                </FormField>
                <FormField id="wh-code" label="Code" hint="Short and unique · shows on bag labels" error={errors.code}>
                  <input id="wh-code" type="text" value={form.code} onChange={(event) => setField("code", event.target.value.toUpperCase())} aria-invalid={Boolean(errors.code)} placeholder="KHR" maxLength={12} className={inputClass} />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <FormField id="wh-contact" label="Contact person">
                  <input id="wh-contact" type="text" value={form.contact_person} onChange={(event) => setField("contact_person", event.target.value)} className={inputClass} />
                </FormField>
                <FormField id="wh-phone" label="Contact phone">
                  <input id="wh-phone" type="tel" value={form.contact_phone} onChange={(event) => setField("contact_phone", event.target.value)} placeholder="+91" className={inputClass} />
                </FormField>
              </div>
            </section>
          )}

          {current === "location" && (
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold text-foreground">Location</h2>
                <span className="text-[13px] text-muted-foreground">Customers inside the zone order from here</span>
              </div>
              <WarehouseLocationFields form={form} errors={errors} onChange={setField} zones={zones} idPrefix="new" />
            </section>
          )}

          {current === "ops" && (
            <section className={cardClass}>
              <h2 className="font-display text-base font-bold text-foreground">Operations</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr]">
                <FormField id="ops-open" label="Store hours" error={errors.store_hours} className="sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center gap-2">
                    <input id="ops-open" aria-label="Opens at" type="time" value={form.store_open_time} onChange={(event) => setField("store_open_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
                    <span aria-hidden="true">–</span>
                    <input aria-label="Closes at" type="time" value={form.store_close_time} onChange={(event) => setField("store_close_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
                  </div>
                </FormField>
                <FormField id="ops-packby" label="Pack-by target (min)" error={errors.pack_by_minutes}>
                  <input id="ops-packby" type="number" min={1} value={form.pack_by_minutes} onChange={(event) => setField("pack_by_minutes", event.target.value)} className={inputClass} />
                </FormField>
                <FormField id="ops-max" label="Max orders per slot" error={errors.max_orders_per_slot}>
                  <input id="ops-max" type="number" min={1} value={form.max_orders_per_slot} onChange={(event) => setField("max_orders_per_slot", event.target.value)} className={inputClass} />
                </FormField>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Racks</span>
                <div className="flex flex-wrap items-center gap-2">
                  {form.racks.map((rack) => (
                    <span key={rack} className="inline-flex items-center gap-1 rounded-lg bg-muted py-1.5 pl-3 pr-1.5 text-[13px] font-semibold text-foreground">
                      {rack}
                      <button
                        type="button"
                        aria-label={`Remove rack ${rack}`}
                        onClick={() => setField("racks", form.racks.filter((item) => item !== rack))}
                        className="rounded p-0.5 text-muted-foreground hover:bg-border hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border py-1 pl-3 pr-1">
                    <input
                      aria-label="New rack label"
                      value={newRack}
                      onChange={(event) => setNewRack(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addRack();
                        }
                      }}
                      placeholder="A-1"
                      className="w-20 bg-transparent text-[13px] font-semibold outline-none placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={addRack} className="rounded-md px-2 py-0.5 text-[13px] font-semibold text-primary hover:bg-secondary">
                      + Add rack
                    </button>
                  </span>
                </div>
              </div>

              <div className="flex min-h-14 items-center gap-3 border-t border-border pt-3">
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">Auto-assign riders</span>
                  <span className="text-xs text-muted-foreground">Offer packed orders to the nearest rider in the zone</span>
                </span>
                <Switch
                  aria-label="Auto-assign riders"
                  checked={form.auto_assign_riders}
                  onCheckedChange={(checked) => setField("auto_assign_riders", checked)}
                />
              </div>
            </section>
          )}

          {current === "team" && (
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                  Team {staffIsDemo && <DemoBadge title="These people are sample users until the staff API exists." />}
                </h2>
                <Link to="/dashboard/staff/new" className="text-sm font-semibold text-primary hover:text-primary/80">
                  + Create new user
                </Link>
              </div>
              <FormField id="team-manager" label="Admin · store manager (required)" error={errors.managerId}>
                <select
                  id="team-manager"
                  value={managerId}
                  onChange={(event) => {
                    setManagerId(event.target.value);
                    setErrors({});
                  }}
                  aria-invalid={Boolean(errors.managerId)}
                  className={inputClass}
                >
                  <option value="">Pick a store manager</option>
                  {admins.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {fullName(user)} · {assignmentMeta(user, draftId)}
                    </option>
                  ))}
                </select>
              </FormField>

              <span className="text-sm font-semibold text-foreground">Ops staff</span>
              <div className="flex flex-col gap-2">
                {opsStaff.length === 0 && <p className="text-sm text-muted-foreground">No ops staff yet. Create a user first.</p>}
                {opsStaff.map((user) => {
                  const id = String(user.id);
                  const checked = opsIds.includes(id);
                  return (
                    <StaffCheckRow
                      key={id}
                      user={user}
                      checked={checked}
                      meta={assignmentMeta(user, draftId)}
                      onChange={() => setOpsIds(checked ? opsIds.filter((item) => item !== id) : [...opsIds, id])}
                    />
                  );
                })}
              </div>
            </section>
          )}

          <div className="mt-auto flex flex-wrap justify-end gap-2.5">
            <button type="button" disabled={isSaving} onClick={() => save(false)} className={secondaryButtonClass}>
              Save as draft
            </button>
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className={secondaryButtonClass}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext} className={`${primaryButtonClass} px-[22px]`}>
                Next
              </button>
            ) : (
              <button type="button" disabled={isSaving} onClick={() => save(true)} className={primaryButtonClass}>
                <Rocket className="h-4 w-4" aria-hidden="true" />
                {isSaving ? "Saving…" : "Create & go live"}
              </button>
            )}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <section className={cardClass}>
            <h2 className="font-display text-base font-bold text-foreground">Before it goes live</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5">
                  {item.done ? (
                    <Check className="h-[18px] w-[18px] shrink-0 text-primary" aria-label="Done" />
                  ) : (
                    <CircleDashed className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-label="Not done" />
                  )}
                  {item.link ? (
                    <Link to={item.link} className="text-foreground underline-offset-2 hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <div className="flex gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
            <Info className="h-[18px] w-[18px] shrink-0 text-blue-700" aria-hidden="true" />
            A draft warehouse is hidden from customers and riders. You can finish setup later from the Warehouses list.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WarehouseNewPage;
