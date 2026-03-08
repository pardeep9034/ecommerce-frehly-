import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_CATEGORY = {
  name: "",
  slug: "",
  image: "",
  status: true,
};

const CategoryModal = ({ open, onClose, category, onSave }) => {
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const isEditMode = Boolean(category);

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        image: category.image || "",
        status: category.status,
      });
      return;
    }

    setForm(EMPTY_CATEGORY);
  }, [category, open]);

  if (!open) {
    return null;
  }

  const onChangeField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    onSave({ ...form, slug, status: form.status === true || form.status === "true" });
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
            {isEditMode ? "Edit Category" : "Add Category"}
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
          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="cat-name">
              Category Name
            </label>
            <input
              id="cat-name"
              name="name"
              value={form.name}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="cat-slug">
              Slug
            </label>
            <input
              id="cat-slug"
              name="slug"
              value={form.slug}
              onChange={onChangeField}
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Auto-generated from name if empty"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="cat-image">
              Image URL
            </label>
            <input
              id="cat-image"
              name="image"
              value={form.image}
              onChange={onChangeField}
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Enter image URL"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="cat-status">
              Status
            </label>
            <select
              id="cat-status"
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
              {isEditMode ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
