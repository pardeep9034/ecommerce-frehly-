import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import useVariant from "@/hooks/use-variant";
import useWarehouse from "@/hooks/use-warehouse";
import useProduct from "@/hooks/use-product";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOVEMENT_TYPES = ["STOCK_IN", "SALE", "ADJUSTMENT", "DAMAGE", "RETURN"];
const MOVEMENT_TYPE_OPTIONS = MOVEMENT_TYPES.map((type) => ({ name: type, id: type }));

const movementSchema = z
  .object({
    product_id: z.coerce.string().min(1, "Select a product"),
    variant_id: z.coerce.string().min(1, "Select a variant"),
    warehouse_id: z.coerce.string().min(1, "Select a warehouse"),
    movement_type: z.string().min(1, "Select a movement type"),
    quantity: z.coerce.number().optional(),
    after_stock: z.coerce.number().optional(),
    reason: z.string().min(1, "Enter a reason"),
  })
  .superRefine((values, ctx) => {
    if (values.movement_type === "ADJUSTMENT") {
      if (values.after_stock === undefined || Number.isNaN(values.after_stock)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["after_stock"], message: "Enter the after-stock quantity" });
      }
    } else if (values.quantity === undefined || Number.isNaN(values.quantity)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Enter a quantity" });
    }
  });

const EMPTY_MOVEMENT = {
  product_id: "",
  variant_id: "",
  warehouse_id: "",
  movement_type: "",
  quantity: "",
  after_stock: "",
  reason: "",
};

const MovementModal = ({ open, onClose, movement, onSave }) => {
  const [currentPage] = useState(1);

  const form = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: EMPTY_MOVEMENT,
  });

  const productId = form.watch("product_id");
  const movementType = form.watch("movement_type");

  const { variants } = useVariant({ productId });
  const { warehouses } = useWarehouse(currentPage, 1);
  const { productSelection } = useProduct({ page: currentPage, limit: 10 });

  const variantOptions = (variants || []).map((v) => ({ name: `${v.quantity} ${v.measurementUnit.code}`, id: v.id }));

  useEffect(() => {
    form.reset(EMPTY_MOVEMENT);
  }, [movement, open]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    const { product_id: _product_id, ...rest } = values;
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
          <h2 className="font-display text-lg font-semibold text-foreground">Add Stock</h2>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={productSelection?.data?.products}
                        labelKey="name"
                        valueKey="id"
                        placeholder="Select product"
                        value={field.value}
                        onSelect={(value) => {
                          field.onChange(value);
                          form.setValue("variant_id", "");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={variantOptions}
                        labelKey="name"
                        valueKey="id"
                        placeholder="Select variant"
                        value={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <FormControl>
                    <SearchableSelector
                      id={field.name}
                      ref={field.ref}
                      data={warehouses}
                      labelKey="name"
                      valueKey="id"
                      placeholder="Select warehouse"
                      value={field.value}
                      onSelect={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movement_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement type</FormLabel>
                  <FormControl>
                    <SearchableSelector
                      id={field.name}
                      ref={field.ref}
                      data={MOVEMENT_TYPE_OPTIONS}
                      labelKey="name"
                      valueKey="id"
                      placeholder="Select movement type"
                      value={field.value}
                      onSelect={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {movementType !== "ADJUSTMENT" && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter quantity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {movementType === "ADJUSTMENT" && (
              <FormField
                control={form.control}
                name="after_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter after stock"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          form.setValue("quantity", event.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reason" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add stock</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default MovementModal;
