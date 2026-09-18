import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useVariant from "@/hooks/use-variant";
import useWarehouse from "@/hooks/use-warehouse";
import SearchableSelector from "@/components/common/SearchableSelector";
import useProduct from "@/hooks/use-product";
const EMPTY_MOVEMENT = {
  variant_id:"",
  warehouse_id:"",
  product_id:"",
  movement_type:"",
  quantity:0,
  // before_stock:"",
  after_stock:0,
  reason:"",
};
const MOVEMENT_TYPES = ["STOCK_IN", "SALE","ADJUSTMENT","DAMAGE","RETURN"];

const MovementModal = ({ open, onClose, movement, onSave }) => {
  const [form, setForm] = useState(EMPTY_MOVEMENT);
  const isEditMode = Boolean(movement && movement.id);
  const [currentPage, setCurrentPage] = useState(1);

const {variants}=useVariant({productId:form.product_id});
const {warehouses}=useWarehouse(currentPage,1);
const {productSelection}=useProduct({page: currentPage, limit: 10});


  // useEffect(() => {
    
  //   setForm(EMPTY_MOVEMENT);
  // }, [movement, open]);

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
  const{product_id,...rest}=form;
    onSave(rest);
  
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
           Add stock
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
          
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="product">
                Product
              </label>
              <SearchableSelector
                data={productSelection?.data?.products}
                labelKey="name"
                valueKey="id"
                placeholder="Select Product"
                // value={form.product_id}
                onSelect={(value, item) =>
                  setForm((prev) => ({ ...prev, product_id: value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="variant">
                variant
              </label>
              <SearchableSelector
                data={variants?.map((v) => ({ name: `${v.quantity} ${v.measurementUnit.code}` , id: v.id }))}
                labelKey="name"
                valueKey="id"
                placeholder="Select Variant"
                // value={form.variant_id}
                onSelect={(value, item) =>
                  setForm((prev) => ({ ...prev, variant_id: value }))
                }
              />
            </div>
            
          
          </div>
          <div>
              <label className="text-sm font-medium text-foreground" htmlFor="product">
                warehouse
              </label>
              <SearchableSelector
                data={warehouses}
                labelKey="name"
                valueKey="id"
                placeholder="Select Warehouse"
                // value={form.warehouse_id}
                onSelect={(value, item) =>
                  setForm((prev) => ({ ...prev, warehouse_id: value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="movement_type">
                movement type
              </label>
              <SearchableSelector
                data={MOVEMENT_TYPES.map((type) => ({ name: type, id: type }))}
                labelKey="name"
                valueKey="id"
                placeholder="Select Movement Type"
                // value={form.movement_type}
                onSelect={(value, item) =>
                  setForm((prev) => ({ ...prev, movement_type: value }))
                }
              />
              </div>
         {form.movement_type!=="ADJUSTMENT"&&
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              value={form.quantity}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter quantity"
            />
          </div>
         }

       

      {form.movement_type==="ADJUSTMENT"&&
      
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="after_Stock">
              quantity
            </label>
            <input
              id="after_Stock"
              name="after_stock"
              value={(form.after_stock)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev, after_stock: Number(event.target.value),quantity: Number(event.target.value) 
                }))
              }
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter after stock"
            />
          </div>}

          
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="reason">
              Reason
            </label>
            <input
              id="reason"
              name="reason"
              value={form.reason}
              onChange={onChangeField}
              required
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter reason"
            />
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
               Add stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovementModal;
