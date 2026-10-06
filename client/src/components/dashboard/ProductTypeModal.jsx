import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

// Inline edit panel next to the product-type table (ProductTypePage), not a modal — `productType` null means "add new".
const ProductTypeModal = ({ productType, onCancel, onSave }) => {
  const isEditMode = Boolean(productType);

  const form = useForm({
    resolver: zodResolver(productTypeSchema),
    defaultValues: EMPTY_PRODUCTTYPE,
  });

  useEffect(() => {
    form.reset(
      productType
        ? {
            name: productType.name || "",
            code: productType.code || "",
            is_active: Boolean(productType.is_active),
          }
        : EMPTY_PRODUCTTYPE
    );
  }, [productType, form]);

  const onSubmit = (values) => {
    onSave(isEditMode ? { ...values, id: productType.id } : values);
  };

  return (
    <aside className="flex w-full shrink-0 animate-in flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card duration-200 fade-in slide-in-from-right-4 lg:w-85">
      <h2 className="font-display text-base font-semibold text-foreground">
        {isEditMode ? `Edit · ${productType.name}` : "Add product type"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter code" {...field} />
                </FormControl>
                <FormDescription>Capital letters, unique</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product type name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                <div className="flex-1">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <p className="text-xs text-muted-foreground">Can be picked on products</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="mt-auto flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset(EMPTY_PRODUCTTYPE);
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save" : "Add type"}</Button>
          </div>
        </form>
      </Form>
    </aside>
  );
};

export default ProductTypeModal;
