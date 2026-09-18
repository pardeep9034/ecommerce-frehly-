import { useEffect, useState } from "react";
import { X } from "lucide-react";
const EMPTY_BRAND = {
 
  name: "",
   logo_url:"",
   description:"",
  is_active:"",
};

const BrandModal = ({ open, onClose, brand, onSave }) => {
  const [form, setForm] = useState(EMPTY_BRAND);
  const isEditMode = Boolean(brand);



  useEffect(() => {
    if (brand) {
      setForm({
       name:brand.name,
      logo_url:brand.logo_url,
      description:brand.description,
       is_active:brand.is_active
      });
      return;
    }
    setForm(EMPTY_BRAND);
  }, [brand, open]);

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
      id: brand.id,
    });
  } else {
    onSave(form);
  }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-border bg-white shadow-card max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-7">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isEditMode ? "Edit Brand" : "Add Brand"}
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
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Brand Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter Brand Name"
            />
          </div>

       

          {/* logo url */}
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="logo_url">
              Logo Url
            </label>
            <input
              id="logo_url"
              name="logo_url"
              value={form.logo_url}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter logo url"
            />
          </div>
             {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={onChangeField}
              rows={3}
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter product description"
            />
          </div>
              <div>
              <label className="text-sm font-medium text-foreground" htmlFor="is_active">
                Status
              </label>
              <select
                id="is_active"
                name="is_active"
                value={form.is_active }
                onChange={onChangeField}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

          {/* Actions */}
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
              {isEditMode ? "Save Changes" : "Add Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandModal;
