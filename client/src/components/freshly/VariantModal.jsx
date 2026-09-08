import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useUnits from "@/hooks/use-units";

const EMPTY_VARIANT = {
  unitType: "",
  quantity: "",
  unit: "",
  price: "",
  mrp: "",
  status: "",
  measurement_unit_id:"",
  barcode:""
};

const UNIT_OPTIONS = [
  "WEIGHT",
  "VOLUME",
  "COUNT",
  "PACKAGING",
];

const VariantModal = ({ open, onClose, variant, onSave }) => {
  const [form, setForm] = useState(EMPTY_VARIANT);

  const isEditMode = Boolean(variant);

  const { unitsData } = useUnits();

  // All units coming from API
  const units = unitsData?.data?.units || [];

  /*
   * Group units by category.
   *
   * Example:
   * {
   *   WEIGHT: [
   *     { id: 1, code: "KG", name: "Kilogram", category: "WEIGHT" },
   *     { id: 2, code: "G", name: "Gram", category: "WEIGHT" }
   *   ],
   *   VOLUME: [
   *     { id: 3, code: "L", name: "Liter", category: "VOLUME" }
   *   ]
   * }
   */
  const unitsByCategory = units.reduce((acc, unit) => {
    if (!acc[unit.category]) {
      acc[unit.category] = [];
    }

    acc[unit.category].push(unit);

    return acc;
  }, {});

  // Units that should be displayed in the second dropdown
  const availableUnits = unitsByCategory[form.unitType] || [];
console.log("variant -----" ,variant);

  useEffect(() => {
    if (variant) {
      setForm({
        ...variant,
        quantity: String(variant.quantity ?? ""),
        price: String(variant.price ?? ""),
        mrp: String(variant.mrp ?? ""),
        unitType: variant.measurementUnit.category ?? "",
        unit: variant.measurementUnit.code ?? "",
        status: variant.status ??"ARCHIVED" ,
        measurement_unit_id:variant.measurementUnit.id??"",
        barcode:variant.barcode??""
      });

      return;
    }

    setForm(EMPTY_VARIANT);
  }, [variant, open]);

  if (!open) return null;

  const onChangeField = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onChangeUnitType = (event) => {
    const unitType = event.target.value;

    const categoryUnits = unitsByCategory[unitType] || [];

    setForm((prev) => ({
      ...prev,
      unitType,
      // Automatically select first unit of selected category
      measurement_unit_id: categoryUnits.length > 0 ? categoryUnits[0].id : "",
    }));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    onSave({
      quantity: Number.parseFloat(form.quantity) || 0,
      price: Number.parseFloat(form.price) || 0,
      mrp: Number.parseFloat(form.mrp) || 0,
      measurement_unit_id:Number.parseInt(form.measurement_unit_id),
      status: form.status || "ARCHIVED",
      barcode:form.barcode
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
          <h2 className="font-display text-lg font-semibold text-[#1f2937]">
            {isEditMode ? "Edit Variant" : "Add Variant"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          {/* Unit Type + Unit */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Unit Type */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="var-unitType"
              >
                Unit Type
              </label>

              <select
                id="var-unitType"
                name="unitType"
                value={form.unitType}
                onChange={onChangeUnitType}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="">Select unit type</option>

                {UNIT_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="var-unit"
              >
                Unit
              </label>

              <select
                id="var-unit"
                name="unit"
                value={form.measurement_unit_id}
                onChange={onChangeField}
                disabled={!form.unitType || availableUnits.length === 0}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
              >
                {!form.unitType && (
                  <option value="">
                    Select unit type first
                  </option>
                )}

                {form.unitType && availableUnits.length === 0 && (
                  <option value="">
                    No units available
                  </option>
                )}

                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} 
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value */}
          <div>
            <label
              className="text-sm font-medium text-[#1f2937]"
              htmlFor="var-value"
            >
              Value
            </label>

            <input
              id="var-value"
              name="quantity"
              type="number"
              step="0.01"
              value={form.quantity}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder={
                form.unitType === "PACKAGING"
                  ? "Items in pack"
                  : "e.g. 500"
              }
            />
          </div>

          {/* Price + MRP */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Selling Price */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="var-price"
              >
                Selling Price
              </label>

              <input
                id="var-price"
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                placeholder="0.00"
              />
            </div>

            {/* MRP */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="var-mrp"
              >
                MRP
              </label>

              <input
                id="var-mrp"
                name="mrp"
                type="number"
                step="0.01"
                value={form.mrp}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                placeholder="0.00"
              />
            </div>
          </div>
           <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="var-mrp"
              >
                BARCODE
              </label>

              <input
                id="var-mrp"
                name="barcode"
                type="number"
                step="1.00"
                value={form.barcode}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                placeholder="0.00"
              />
            </div>

          {/* Status */}
          <div>
            <label
              className="text-sm font-medium text-[#1f2937]"
              htmlFor="var-status"
            >
              Status
            </label>

            <select
              id="var-status"
              name="status"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
            >
              <option value="">Select status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#1f2937] transition-colors hover:bg-[#f3f4f6]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
            >
              {isEditMode ? "Save Changes" : "Add Variant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantModal;