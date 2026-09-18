import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useCategory from "@/hooks/use-category";
import SearchableSelector from "@/components/common/SearchableSelector";


const EMPTY_CATEGORY = {
  name: "",
  parent_id: null,
 
  image_url: "",
  is_active: true,
  sort_order: 0,
};

const CategoryModal = ({ open, onClose, category, onSave }) => {
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const isEditMode = Boolean(category);
  const [searchTerm, setSearchTerm] = useState("");
  const{allCategories,isLoadingAllCategories,errorAllCategories}=useCategory(1,10,searchTerm);
  

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
    
        image_url: category.image_url || "",
        is_active: category.is_active,
        parent_id: category.parent_id || null,
        sort_order: category.sort_order ?? 0,
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
 
    onSave({ ...form,id:category?.id
      
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-border bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-7">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isEditMode ? "Edit Category" : "Add Category"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="cat-name">
              Category Name
            </label>
            <input
              id="cat-name"
              name="name"
              value={form.name}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter category name"
            />
          </div>
          <div>
              <label className="text-sm font-medium text-foreground" htmlFor="cat-parent">
              Parent Category
            </label>
            <SearchableSelector
              id="cat-parent"
              labelKey="name"
              valueKey="id"
              onSelect={(id)=>setForm((prev)=>({...prev,parent_id:id}))}
              onSearchChange={(q)=>setSearchTerm(q)}
              serverSearch={true}
              value={form.parent_id}
              data={allCategories?.data?.categories
                .filter((item) => item.id !== category?.id)

                
              }
              placeholder="Select parent category"
            />
          </div>

       
         

          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="cat-image">
              Image URL
            </label>
            <input
              id="cat-image"
              name="image_url"
              value={form.image_url}
              onChange={onChangeField}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter image URL"
            />
          </div>


          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
            <label className="text-sm font-medium text-foreground" htmlFor="cat-sort-order">
              Sort Order
           
            </label>
           <input
              id="cat-sort-order"
              name="sort_order"
              type="number"
              value={form.sort_order}
              onChange={onChangeField}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter sort order"
            />
          </div>
           <div>
             <label className="text-sm font-medium text-foreground" htmlFor="cat-status">
              Status
            </label>
            <select
              id="cat-status"
              name="is_active"
              value={String(form.is_active)}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          </div>
      

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
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
