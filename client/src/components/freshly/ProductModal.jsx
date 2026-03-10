import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useCategory from "@/hooks/use-category";

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  categoryId: "",
  productType: "",
  brand: "Freshly",
  isOrganic: false,
  image: "",
  status: true,
};

const ProductModal = ({ open, onClose, product, onSave }) => {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const isEditMode = Boolean(product);

  const { categories: categoriesData } = useCategory();
  const categoriesList = categoriesData?.data?.categories || [];

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        categoryId: String(product.categoryId || ""),
        isOrganic: Boolean(product.isOrganic),
        status: Boolean(product.status),
      });
      return;
    }
    setForm(EMPTY_PRODUCT);
  }, [product, open]);

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
    onSave({
      ...form,
      categoryId: Number(form.categoryId),
    });
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
            {isEditMode ? "Edit Product" : "Add Product"}
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
          {/* Product Name */}
          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="name">
              Product Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="image">
              Image
            </label>
            <input
              id="image"
              name="image"
              value={form.image}
              onChange={onChangeField}
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Enter product image"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={onChangeField}
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] resize-none"
              placeholder="Enter product description"
            />
          </div>

          {/* Category & Product Type */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="" disabled>Select a category</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="productType">
                Product Type
              </label>
              <select
                id="productType"
                name="productType"
                value={form.productType}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="" disabled>Select type</option>
                <option value="Fresh">Fresh</option>
                <option value="Frozen">Frozen</option>
                <option value="Packaged">Packaged</option>
                <option value="Beverage">Beverage</option>
                <option value="Bakery">Bakery</option>
              </select>
            </div>
          </div>

          {/* Brand & Status */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="brand">
                Brand
              </label>
              <input
                id="brand"
                name="brand"
                value={form.brand}
                onChange={onChangeField}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                placeholder="e.g. Freshly"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#1f2937]" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status ? "true" : "false"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value === "true" }))
                }
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Organic Toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
            <input
              id="isOrganic"
              name="isOrganic"
              type="checkbox"
              checked={form.isOrganic}
              onChange={onChangeField}
              className="h-4 w-4 rounded border-[#e5e7eb] accent-[#0f5132]"
            />
            <label htmlFor="isOrganic" className="text-sm font-medium text-[#1f2937] cursor-pointer">
              Organic Product
            </label>
          </div>

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
              {isEditMode ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
