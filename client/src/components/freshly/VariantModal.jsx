import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_VARIANT = {
  unitType: "weight",
  value: "",
  unit: "kg",
  price: "",
  mrp: "",
  status: true,
};

const UNIT_OPTIONS = {
  weight: ["kg", "g", "lb", "oz"],
  piece: ["pc"],
  pack: ["pack"],
};

const VariantModal = ({ open, onClose, variant, onSave }) => {
  const [form, setForm] = useState(EMPTY_VARIANT);
  const isEditMode = Boolean(variant);

  useEffect(() => {
    if (variant) {
      setForm({
        ...variant,
        value: String(variant.value),
        price: String(variant.price),
        mrp: String(variant.mrp),
      });
      return;
    }

    setForm(EMPTY_VARIANT);
  }, [variant, open]);

  if (!open) return null;

  const onChangeField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeUnitType = (event) => {
    const unitType = event.target.value;
    const units = UNIT_OPTIONS[unitType];
    setForm((prev) => ({ ...prev, unitType, unit: units[0] }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      value: Number.parseFloat(form.value) || 0,
      price: Number.parseFloat(form.price) || 0,
      mrp: Number.parseFloat(form.mrp) || 0,
      status: form.status === true || form.status === "true",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
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

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="var-unitType">
                Unit Type
              </label>
              <select
                id="var-unitType"
                name="unitType"
                value={form.unitType}
                onChange={onChangeUnitType}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="weight">Weight</option>
                <option value="piece">Piece</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="var-unit">
                Unit
              </label>
              <select
                id="var-unit"
                name="unit"
                value={form.unit}
                onChange={onChangeField}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                {UNIT_OPTIONS[form.unitType].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="var-value">
              Value
            </label>
            <input
              id="var-value"
              name="value"
              type="number"
              step="0.01"
              value={form.value}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder={form.unitType === "pack" ? "Items in pack" : "e.g. 500"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="var-price">
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

            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="var-mrp">
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
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="var-status">
              Status
            </label>
            <select
              id="var-status"
              name="status"
              value={String(form.status)}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value === "true" }))}
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

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
