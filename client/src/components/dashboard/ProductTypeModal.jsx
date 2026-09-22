import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const productTypeSchema = z.object({
  name: z.string().min(1, "Enter a product type name"),
  code: z.string().min(1, "Enter a code"),
  is_active: z.boolean().default(true),
});

const EMPTY_PRODUCTTYPE = {
  name: "",
  code: "",
  is_active: true,
};

const ProductTypeModal = ({ open, onClose, productType, onSave }) => {
  const isEditMode = Boolean(productType);

  const form = useForm({
    resolver: zodResolver(productTypeSchema),
    defaultValues: EMPTY_PRODUCTTYPE,
  });

  useEffect(() => {
    if (productType) {
      form.reset({
        name: productType.name || "",
        code: productType.code || "",
        is_active: Boolean(productType.is_active),
      });
      return;
    }
    form.reset(EMPTY_PRODUCTTYPE);
  }, [productType, open]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    onSave(isEditMode ? { ...values, id: productType.id } : values);
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
            {isEditMode ? "Edit Product Type" : "Add Product Type"}
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product type name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product type name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Toggle */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="mt-2 flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? "Save changes" : "Add product type"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProductTypeModal;
