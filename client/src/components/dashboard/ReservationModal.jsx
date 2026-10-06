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

const reservationSchema = z.object({
  order_id: z.coerce.number({ invalid_type_error: "Enter an order id" }).int().positive("Enter an order id"),
  product_id: z.coerce.string().min(1, "Select a product"),
  variant_id: z.coerce.string().min(1, "Select a variant"),
  warehouse_id: z.coerce.string().min(1, "Select a warehouse"),
  quantity: z.coerce.number().int().positive("Enter a quantity"),
  expires_at: z.string().optional().default(""),
});

const EMPTY_RESERVATION = {
  order_id: "",
  product_id: "",
  variant_id: "",
  warehouse_id: "",
  quantity: "",
  expires_at: "",
};

const ReservationModal = ({ open, onClose, onSave }) => {
  const [currentPage] = useState(1);

  const form = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: EMPTY_RESERVATION,
  });

  const productId = form.watch("product_id");

  const { variants } = useVariant({ productId });
  const { warehouses } = useWarehouse(currentPage, 1);
  const { productSelection } = useProduct({ page: currentPage, limit: 10 });

  const variantOptions = (variants || []).map((v) => ({ name: `${v.quantity} ${v.measurementUnit.code}`, id: v.id }));

  useEffect(() => {
    form.reset(EMPTY_RESERVATION);
  }, [open, form]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    onSave({
      order_id: values.order_id,
      variant_id: Number(values.variant_id),
      warehouse_id: Number(values.warehouse_id),
      quantity: values.quantity,
      expires_at: values.expires_at || undefined,
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
          <h2 className="font-display text-lg font-semibold text-foreground">Create reservation</h2>
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
            <FormField
              control={form.control}
              name="order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 1042" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter quantity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires at (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create reservation</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ReservationModal;
