import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import SearchableSelector from "@/components/common/SearchableSelector";
import useProduct from "@/hooks/use-product";
import useVariant from "@/hooks/use-variant";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const inventorySchema = z.object({
  variantId: z.coerce.string().min(1, "Select a variant"),
  warehouseId: z.coerce.string().min(1, "Select a warehouse"),
  stock: z.coerce.number({ invalid_type_error: "Enter a stock value" }).min(0, "Enter a stock value"),
  reservedStock: z.coerce.number().min(0).default(0),
  lowStockAlert: z.coerce.number().min(0).default(5),
});

const EMPTY_INVENTORY = {
  variantId: "",
  warehouseId: "",
  stock: 0,
  reservedStock: 0,
  lowStockAlert: 5,
};

const InventoryModal = ({ open, onClose, inventory, onSave, warehouses = [], selectedWarehouseId, isWarehousesLoading }) => {
  const isEditMode = Boolean(inventory);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);

  const { searchedProduct } = useProduct({ page: 1, limit: 10, search: productSearch });
  const { variantInfo } = useVariant({ variantIds: searchedProduct?.data?.variantIds });

  const form = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: EMPTY_INVENTORY,
  });

  useEffect(() => {
    if (inventory) {
      const existingVariant = inventory.variant;
      form.reset({
        variantId: String(inventory.variantId || inventory.variant_id || ""),
        warehouseId: String(inventory.warehouse_id || inventory.warehouseId || ""),
        stock: inventory.stock ?? inventory.current_stock ?? 0,
        reservedStock: inventory.reservedStock ?? inventory.reserved_stock ?? 0,
        lowStockAlert: inventory.lowStockAlert ?? inventory.low_stock_threshold ?? 5,
      });
      setProductSearch(existingVariant?.product?.name || existingVariant?.product_name || "");
      setSelectedProductId(existingVariant?.product?.id || existingVariant?.product_id || null);
      return;
    }

    form.reset({ ...EMPTY_INVENTORY, warehouseId: selectedWarehouseId ? String(selectedWarehouseId) : "" });
    setProductSearch("");
    setSelectedProductId(null);
  }, [inventory, open, selectedWarehouseId]);

  if (!open) {
    return null;
  }

  const handleProductSelect = (product) => {
    setSelectedProductId(product.id);
    form.setValue("variantId", "");
  };

  const onSubmit = (values) => {
    onSave({
      variant_id: Number.parseInt(values.variantId, 10),
      warehouse_id: Number.parseInt(values.warehouseId, 10),
      current_stock: values.stock,
      reserved_stock: values.reservedStock,
      low_stock_threshold: values.lowStockAlert,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-border bg-white shadow-card max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-7">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isEditMode ? "Edit Inventory" : "Add Inventory"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="product-search">
                Product
              </label>
              <div className="mt-1">
                <SearchableSelector
                  id="product-search"
                  data={searchedProduct?.data}
                  onSearchChange={setProductSearch}
                  onSelect={(id, item) => handleProductSelect(item)}
                  placeholder="Search products"
                  value={selectedProductId}
                  serverSearch={true}
                  disabled={Boolean(selectedProductId)}
                />
              </div>
            </div>

            {!isEditMode && (
              <FormField
                control={form.control}
                name="variantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      disabled={!selectedProductId || !variantInfo?.data?.length}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select a variant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {variantInfo?.data?.map((variant) => (
                          <SelectItem key={variant.id} value={String(variant.id)}>
                            {variant.variant_name || variant.name || `Variant #${variant.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!isEditMode && (
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      disabled={isWarehousesLoading}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={isWarehousesLoading ? "Loading warehouses..." : "Select a warehouse"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reservedStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reserved stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lowStockAlert"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low stock alert threshold</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? "Save changes" : "Create inventory"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default InventoryModal;
