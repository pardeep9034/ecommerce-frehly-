import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, CircleDashed, Info, Rocket } from "lucide-react";
import FormField from "@/components/dashboard/FormField";
import StaffCheckRow from "@/components/dashboard/StaffCheckRow";
import StatusPill from "@/components/dashboard/StatusPill";
import DemoBadge from "@/components/dashboard/DemoBadge";
import WarehouseLocationFields from "@/components/dashboard/WarehouseLocationFields";
import warehouseApi from "@/apis/warehouseApi";
import staffApi from "@/apis/staffApi";
import useWarehouse, { useWarehouseDetail } from "@/hooks/use-warehouse";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import useStaff from "@/hooks/use-staff";
import { notify } from "@/lib/notify";
import { assignmentMeta, fullName } from "@/lib/staffRole";
import { WAREHOUSE_STATUS } from "@/lib/warehouseStatus";
import { SUPER_ADMIN_HINT, warehouseAccess } from "@/lib/warehouseAccess";
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

  // Only the super admin adds a warehouse and picks its team; a store manager may finish their own store's draft.
  const { isSuperAdmin, manages } = warehouseAccess(draftId);
  const allowed = draftId ? manages : isSuperAdmin;

  const admins = allStaff.filter((user) => user.role === "ADMIN" && user.is_active);
  const opsStaff = allStaff.filter((user) => user.role === "OPS_STAFF" && user.is_active);
  const existingManager = draftId ? admins.find((user) => String(user.warehouse_id) === String(draftId)) : null;
  const hasManager = Boolean(managerId || existingManager);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, store_hours: undefined }));
  };

  const checklist = useMemo(() => {
    const locationOk = Object.keys(validateLocation(form)).length === 0;
    return [
      { label: "Name and code", done: Boolean(form.name.trim() && form.code.trim()) },
      { label: "Map pin inside a delivery zone", done: locationOk },
      { label: "Store hours and pack-by target", done: Object.keys(validateOperations(form)).length === 0 },
      { label: "A store manager assigned", done: hasManager },
      { label: "Stock added in Inventory", done: false, link: "/admin/inventory" },
    ];
  }, [form, hasManager]);

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

  // The create schema takes only the basics, so pincode, hours and pack-by follow as an update. The team is each
  // person's own warehouse_id on their staff account. The warehouse itself is saved either way.
  const saveExtras = async (warehouseId, live) => {
    const teamIds = isSuperAdmin ? [managerId, ...opsIds].filter((id) => id && Number(id) > 0) : [];
    const results = await Promise.allSettled([
      warehouseApi.updateWarehouse(warehouseId, {
        ...settingsPayload(form),
        pincode: form.pincode.trim() || null,
        ...(live && { operational_status: "OPEN" }),
      }),
      ...teamIds.map((userId) => staffApi.updateStaff(Number(userId), { warehouse_id: Number(warehouseId) })),
    ]);
    const failures = results.filter((result) => result.status === "rejected").map((result) => result.reason);
    if (staffIsDemo && (managerId || opsIds.length)) {
      notify.warning("Warehouse saved. The team needs the staff API before it’s stored.");
    } else if (failures.length) {
      notify.apiError(failures[0], "Warehouse saved, but its settings or team failed to save");
    }
  };

  const save = async (live) => {
    // The backend needs name, code, zone and coordinates even for a draft.
    if (!validateThrough(live ? STEPS.length - 1 : 1)) return;
    if (live && !hasManager) {
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
      navigate(live && warehouseId ? `/admin/warehouses/${warehouseId}` : "/admin/warehouses");
    } catch {
      // The mutation's onError already showed the reason.
    } finally {
      setIsSaving(false);
    }
  };

  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">
        {draftId ? "Only this store's manager or the super admin can finish its setup." : "Only the super admin can add a warehouse."}
      </p>
    );
  }

  const current = STEPS[step].key;
  const title = form.name.trim() || "Untitled";

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/admin/warehouses" className="font-medium hover:text-foreground">
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
                <FormField id="wh-contact" label="Contact person" hint={isSuperAdmin ? undefined : SUPER_ADMIN_HINT}>
                  <input id="wh-contact" type="text" value={form.contact_person} onChange={(event) => setField("contact_person", event.target.value)} disabled={!isSuperAdmin} className={inputClass} />
                </FormField>
                <FormField id="wh-phone" label="Contact phone" hint={isSuperAdmin ? undefined : SUPER_ADMIN_HINT}>
                  <input id="wh-phone" type="tel" value={form.contact_phone} onChange={(event) => setField("contact_phone", event.target.value)} disabled={!isSuperAdmin} placeholder="+91" className={inputClass} />
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
              <WarehouseLocationFields form={form} errors={errors} onChange={setField} zones={zones} idPrefix="new" zoneLocked={!isSuperAdmin} />
            </section>
          )}

          {current === "ops" && (
            <section className={cardClass}>
              <h2 className="font-display text-base font-bold text-foreground">Operations</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1.6fr_1fr]">
                <FormField id="ops-open" label="Store hours" hint="Empty = open all day · closing before opening runs past midnight" error={errors.store_hours}>
                  <div className="flex items-center gap-2">
                    <input id="ops-open" aria-label="Opens at" type="time" value={form.store_open_time} onChange={(event) => setField("store_open_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
                    <span aria-hidden="true">–</span>
                    <input aria-label="Closes at" type="time" value={form.store_close_time} onChange={(event) => setField("store_close_time", event.target.value)} className={`${inputClass} min-w-0 px-2.5`} />
                  </div>
                </FormField>
                <FormField id="ops-packby" label="Pack-by target (min)" error={errors.pack_by_minutes}>
                  <input id="ops-packby" type="number" min={1} value={form.pack_by_minutes} onChange={(event) => setField("pack_by_minutes", event.target.value)} className={inputClass} />
                </FormField>
              </div>
            </section>
          )}

          {current === "team" && !isSuperAdmin && (
            <section className={cardClass}>
              <h2 className="font-display text-base font-bold text-foreground">Team</h2>
              <p className="text-sm text-foreground">
                Store manager: {existingManager ? fullName(existingManager) : "none yet"}
              </p>
              {errors.managerId && <p className="text-sm text-destructive">{errors.managerId}</p>}
              <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {SUPER_ADMIN_HINT}
              </p>
            </section>
          )}

          {current === "team" && isSuperAdmin && (
            <section className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
                  Team {staffIsDemo && <DemoBadge title="These people are sample users until the staff API exists." />}
                </h2>
                <Link to="/admin/staff/new" className="text-sm font-semibold text-primary hover:text-primary/80">
                  + Add new staff
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
