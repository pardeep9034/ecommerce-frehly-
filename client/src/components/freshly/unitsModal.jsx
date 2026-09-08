import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useUnits from "@/hooks/use-units";
const EMPTY_UNITS = {
 
  name: "",
  code:"",
  category:"",
  is_active:"",
};

const UnitsModal = ({ open, onClose, unit, onSave }) => {
  const [form, setForm] = useState(EMPTY_UNITS);
  const isEditMode = Boolean(unit);



  useEffect(() => {
    if (unit) {
      setForm({
       name:unit.name,
       code:unit.code,
       category:unit.category,
       is_active:unit.is_active
      });
      return;
    }
    setForm(EMPTY_UNITS);
  }, [unit, open]);

  if (!open) {
    return null;
  }

  const onChangeField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
     if (isEditMode) {
    onSave({
      ...form,
      id: unit.id,
    });
  } else {
    onSave(form);
  }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white shadow-card max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
          <h2 className="font-display text-lg font-semibold text-[#1f2937]">
            {isEditMode ? "Edit Unit" : "Add Unit"}
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
          {/* unit Name */}
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category }
                onChange={onChangeField}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="">Select Category</option>
                <option value="WEIGHT">WEIGHT</option>
                <option value="VOLUME">VOLUME</option>
                <option value="COUNT">COUNT</option>
                <option value="PACKAGING">PACKAGING</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="is_active">
                Status
              </label>
              <select
                id="is_active"
                name="is_active"
                value={form.is_active }
                onChange={onChangeField}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="">Select Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="name">
              Unit Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Enter unit name"
            />
          </div>

       

          {/* Code */}
          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="code">
              Code
            </label>
            <input
              id="code"
              name="code"
              value={form.code}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] resize-none"
              placeholder="Enter unit code"
            />
          </div>

       {/* 'WEIGHT','VOLUME','COUNT','PACKAGING' */}

          {/* category & Status */}
         

       

          {/* Actions */}
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
              {isEditMode ? "Save Changes" : "Add Unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitsModal;
