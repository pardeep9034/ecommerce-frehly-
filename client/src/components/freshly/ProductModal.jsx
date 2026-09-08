import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useCategory from "@/hooks/use-category";
import useProductType from "@/hooks/use-productType";
import SearchableSelector from "../common/searchableSelect";
import useBrand from "@/hooks/use-brand";


const EMPTY_PRODUCT = {
  name: "",
  description: "",
   category_id: "",
  product_type_id: "",
  brand_id: "",
  short_description:"",
  is_organic: false,
  is_featured:false,
  sort_order:0,

  status: "",
};

const ProductModal = ({ open, onClose, product, onSave }) => {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const isEditMode = Boolean(product);
  const [searchQuery,setSearchQuery]=useState("")
  const { categories: categoriesData } = useCategory();
  const {data}=useProductType();
  const {brandsData}=useBrand()
  const categoriesList = categoriesData?.data?.categories || [];

  useEffect(() => {
    if (product) {
      setForm(
        product
     
      );
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
    onSave(
      form
     

    );
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

          {/* <div>
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
          </div> */}

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-[#1f2937]" htmlFor="short_description">
              Short Description
            </label>
            <textarea
              id="short_description"
              name="short_description"
              value={form.short_description}
              onChange={onChangeField}
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] resize-none"
              placeholder="Enter product short description"
            />
          </div>
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
            {/* <div>
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
            </div> */}
<SearchableSelector
data={categoriesData.data?.categories}
labelKey="name"
valueKey="id"
placeholder="search category"
onSelect={(id)=>
  setForm((prev)=>
  ({
    ...prev,
    category_id:id
  })
  )
}


/>
<SearchableSelector
data={data.data?.productTypes}
placeholder="search types"
onSelect={(id)=>
  setForm((prev)=>
  ({
    ...prev,
    product_type_id:id
  })
  )
}
/>
          </div>

          {/* Brand & Status */}
          <div className="grid grid-cols-1 pt-4 gap-4 md:grid-cols-2">
       <SearchableSelector
data={brandsData.data?.brand}
placeholder="search brand"
onSelect={(id)=>
  setForm((prev)=>
  ({
    ...prev,
    brand_id:id
  })
  )
}
/>

            <div>
             
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={
                  onChangeField
                }
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
              >
                <option value="">select status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {/* Organic Toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
            <input
              id="isOrganic"
              name="isOrganic"
              type="checkbox"
              checked={form.is_organic}
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
