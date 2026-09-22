import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import useProduct from "@/hooks/use-product";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const DATA_TYPE_OPTIONS = ["TEXT", "NUMBER", "BOOLEAN"];

const productAttributeSchema = z.object({
  product_id: z.coerce.string().min(1, "Select a product"),
  attribute_name: z.string().min(1, "Enter an attribute name"),
  data_type: z.string().min(1, "Select a data type"),
  attribute_value: z.string().min(1, "Enter an attribute value"),
  is_filterable: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
});

const EMPTY_PRODUCTATTRIBUTE = {
  product_id: "",
  attribute_name: "",
  attribute_value: "",
  data_type: "",
  is_filterable: false,
  sort_order: 0,
};

const ProductAttributeModal = ({ open, onClose, productAttribute, onSave }) => {
  const isEditMode = Boolean(productAttribute);
  const [searchQuery, setSearchQuery] = useState("");
  const { productSelection } = useProduct({ search: searchQuery, page: 1, limit: 10 });
  const productsList = productSelection?.data?.products ?? [];

  const form = useForm({
    resolver: zodResolver(productAttributeSchema),
    defaultValues: EMPTY_PRODUCTATTRIBUTE,
  });

  useEffect(() => {
    if (productAttribute) {
      form.reset({
        product_id: productAttribute.product_id ? String(productAttribute.product_id) : "",
        attribute_name: productAttribute.attribute_name || "",
        attribute_value: productAttribute.attribute_value || "",
        data_type: productAttribute.data_type || "",
        is_filterable: productAttribute.is_filterable === true || productAttribute.is_filterable === "true",
        sort_order: productAttribute.sort_order ?? 0,
      });
      return;
    }
    form.reset(EMPTY_PRODUCTATTRIBUTE);
  }, [productAttribute, open]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    const payload = { ...values, product_id: Number.parseInt(values.product_id, 10) };
    onSave(isEditMode ? { ...payload, id: productAttribute.id } : payload);
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
            {isEditMode ? "Edit Product Attribute" : "Add Product Attribute"}
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
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <SearchableSelector
                      id={field.name}
                      ref={field.ref}
                      data={productsList}
                      labelKey="name"
                      valueKey="id"
                      placeholder="Search product"
                      value={field.value}
                      onSelect={field.onChange}
                      onSearchChange={setSearchQuery}
                      serverSearch={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="attribute_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribute name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter attribute name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATA_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="attribute_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribute value</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter attribute value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="Enter sort order" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_filterable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Filterable</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? "Save changes" : "Add product attribute"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProductAttributeModal;
