import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useProduct from "@/hooks/use-product";
import SearchableSelector from "../common/searchableSelect";

const EMPTY_PRODUCTATTRIBUTE = {
    product_id: null,
  attribute_name: "",
  attribute_value: "",
  data_type: "",
  is_filterable: false,
  sort_order: 0,
};

const ProductAttributeModal = ({
  open,
  onClose,
  productAttribute,
  onSave,
}) => {
  const [form, setForm] = useState(EMPTY_PRODUCTATTRIBUTE);
const [searchQuery, setSearchQuery] = useState(""); 
const {
  productSelection,
  productSelectionLoading,
  productSelectionError,
} = useProduct({
  search:searchQuery,
  page: 1,
  limit: 10,
});

  const isEditMode = Boolean(productAttribute);

  useEffect(() => {
    if (productAttribute) {
      setForm({
        attribute_name: productAttribute.attribute_name || "",
        attribute_value: productAttribute.attribute_value || "",
        data_type: productAttribute.data_type || "",
        product_id: productAttribute.product_id || null,
       
        is_filterable:
          productAttribute.is_filterable === true ||
          productAttribute.is_filterable === "true",
        sort_order: productAttribute.sort_order ?? 0,
      });

      return;
    }

    setForm(EMPTY_PRODUCTATTRIBUTE);
  }, [productAttribute, open]);

  if (!open) {
    return null;
  }

  const onChangeField = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (isEditMode) {
      onSave({
        ...form,
        id: productAttribute.id,
        product_id: productAttribute.product_id,
      });
    } else {
      onSave(form);
    }

    onClose();
  };

  const handleFilterableChange = () => {
    setForm((prev) => ({
      ...prev,
      is_filterable: !prev.is_filterable,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
          <h2 className="font-display text-lg font-semibold text-[#1f2937]">
            {isEditMode
              ? "Edit Product Attribute"
              : "Add Product Attribute"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
 <SearchableSelector
  data={productSelection?.data?.products ?? []}
  serverSearch={true}
  onSearchChange={(q) => setSearchQuery(q)}
  value={form.product_id}
  onSelect={(id) =>
    setForm((prev) => ({
      ...prev,
      product_id: id,
    }))
  }
  placeholder="Search product..."
/>
          {/* Attribute Name + Data Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          

            {/* Attribute Name */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="attribute_name"
              >
                Attribute Name
              </label>

              <input
                id="attribute_name"
                name="attribute_name"
                value={form.attribute_name}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                placeholder="Enter attribute name"
              />
            </div>

            {/* Data Type */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="data_type"
              >
                Data Type
              </label>

              <select
                id="data_type"
                name="data_type"
                value={form.data_type}
                onChange={onChangeField}
                required
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="">Select Value Type</option>
                <option value="TEXT">TEXT</option>
                <option value="NUMBER">NUMBER</option>
                <option value="BOOLEAN">BOOLEAN</option>
              </select>
            </div>
          </div>

          {/* Attribute Value */}
          <div>
            <label
              className="text-sm font-medium text-[#1f2937]"
              htmlFor="attribute_value"
            >
              Attribute Value
            </label>

            <input
              id="attribute_value"
              name="attribute_value"
              value={form.attribute_value}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              placeholder="Enter attribute value"
            />
          </div>

          {/* Filterable + Sort Order */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

             <div className=" flex gap-2  items-center pt-4">
           
              <p className="text-sm font-medium text-[#1f2937]">
                Filterable
              </p>

            

            {/* Custom Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={form.is_filterable}
              onClick={handleFilterableChange}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.is_filterable
                  ? "bg-[#0f5132]"
                  : "bg-[#d1d5db]"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.is_filterable
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

            {/* Sort Order */}
            <div>
              <label
                className="text-sm font-medium text-[#1f2937]"
                htmlFor="sort_order"
              >
                Sort Order
              </label>

              <input
                id="sort_order"
                name="sort_order"
                type="number"
                min="0"
                value={form.sort_order}
                onChange={onChangeField}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                placeholder="Enter sort order"
              />
            </div>
          </div>

          {/* Filterable */}
         

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
              {isEditMode ? "Save Changes" : "Add Product Attribute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductAttributeModal;