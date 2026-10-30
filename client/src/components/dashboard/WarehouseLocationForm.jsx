import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import ReadOnlyNote from "@/components/dashboard/ReadOnlyNote";
import WarehouseLocationFields from "@/components/dashboard/WarehouseLocationFields";
import useWarehouse from "@/hooks/use-warehouse";
import { VIEW_ONLY_HINT } from "@/lib/warehouseAccess";
import { formFromWarehouse, validateLocation, warehousePayload } from "@/lib/warehouseForm";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/lib/formStyles";

// Address, zone and pin with its own Save. Shared by the warehouse detail "Location" tab and the store console
// Settings page. `access` comes from warehouseAccess(warehouse.id); only the super admin changes the zone.
const WarehouseLocationForm = ({ warehouse, access, zones, idPrefix = "detail" }) => {
  const [form, setForm] = useState(() => formFromWarehouse(warehouse));
  const [errors, setErrors] = useState({});
  const { updateMutation } = useWarehouse();
  const readOnly = !access.manages;

  useEffect(() => {
    setForm(formFromWarehouse(warehouse));
  }, [warehouse]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const resetForm = () => {
    setForm(formFromWarehouse(warehouse));
    setErrors({});
  };

  const saveLocation = () => {
    const found = validateLocation(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    // Pincode is update-only (the create schema doesn't take it), so it isn't in warehousePayload.
    updateMutation.mutate({ id: String(warehouse.id), data: { ...warehousePayload(form), pincode: form.pincode.trim() || null } });
  };

  return (
    <section className={cardClass}>
      {readOnly && <ReadOnlyNote>{VIEW_ONLY_HINT}</ReadOnlyNote>}
      <fieldset disabled={readOnly} className="contents">
        <WarehouseLocationFields form={form} errors={errors} onChange={setField} zones={zones} idPrefix={idPrefix} zoneLocked={!access.isSuperAdmin} />
      </fieldset>
      <div className="flex gap-2.5 rounded-xl bg-blue-50 px-3.5 py-3 text-[13px] text-foreground">
        <Info className="h-[18px] w-[18px] shrink-0 text-blue-700" aria-hidden="true" />
        Moving the pin or changing the zone changes which customers can order from this store.
      </div>
      {!readOnly && (
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={resetForm} className={secondaryButtonClass}>Cancel</button>
          <button type="button" onClick={saveLocation} disabled={updateMutation.isPending} className={primaryButtonClass}>
            {updateMutation.isPending ? "Saving…" : "Save location"}
          </button>
        </div>
      )}
    </section>
  );
};

export default WarehouseLocationForm;
