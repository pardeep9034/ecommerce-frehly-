import { useEffect, useState } from "react";
import { X, Tag } from "lucide-react";

const PROMOTION_TYPES = ["HOT", "POPULAR", "DISCOUNT"];
const DISCOUNT_TYPES = ["PERCENT", "FLAT"];

const defaultForm = {
  title: "",
  type: "HOT",
  discountType: "PERCENT",
  discountValue: "",
  startDate: "",
  endDate: "",
  isActive: true,
  priority: 1,
};

const PromotionModal = ({ open, onClose, promotion, onSave }) => {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (promotion) {
      setForm({
        title: promotion.title || "",
        type: promotion.type || "HOT",
        discountType: promotion.discountType || "PERCENT",
        discountValue: promotion.discountValue ?? "",
        startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : "",
        endDate: promotion.endDate ? promotion.endDate.slice(0, 10) : "",
        isActive: promotion.isActive ?? true,
        priority: promotion.priority ?? 1,
      });
    } else {
      setForm(defaultForm);
    }
  }, [promotion, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      discountValue: form.discountValue !== "" ? parseFloat(form.discountValue) : null,
      priority: parseInt(form.priority, 10),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    onSave(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-in zoom-in-95 duration-200 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f5132]/10">
              <Tag className="h-4.5 w-4.5 text-[#0f5132]" />
            </div>
            <h2 className="text-base font-bold text-[#1f2937]">
              {promotion ? "Edit Promotion" : "Add Promotion"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Summer HOT Deals"
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#0f5132] focus:bg-white focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
            />
          </div>

          {/* Type + Discount Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Promotion Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
              >
                {PROMOTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Discount Type
              </label>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
              >
                {DISCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Discount Value + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Discount Value
              </label>
              <input
                type="number"
                name="discountValue"
                value={form.discountValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder={form.discountType === "PERCENT" ? "e.g. 20" : "e.g. 50"}
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Priority
              </label>
              <input
                type="number"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                min="1"
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/15 transition-all"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#1f2937]">Active</p>
              <p className="text-xs text-[#6b7280]">Promotion will be shown on the storefront</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.isActive ? "bg-[#0f5132]" : "bg-[#d1d5db]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                  form.isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f3f4f6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0f5132] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b4128]"
            >
              {promotion ? "Save Changes" : "Create Promotion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionModal;
