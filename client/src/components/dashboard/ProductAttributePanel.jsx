import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useProduct from "@/hooks/use-product";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

// Inline edit panel next to the attribute table (ProductAttributePage). ProductAttributeModal is the dialog
// variant, still used by ProductDetail — `productAttribute` null means "add new".
const ProductAttributePanel = ({ productAttribute, onCancel, onSave }) => {
  const isEditMode = Boolean(productAttribute);
  const [searchQuery, setSearchQuery] = useState("");
  const { productSelection } = useProduct({ search: searchQuery, page: 1, limit: 10 });
  const productsList = productSelection?.data?.products ?? [];

  const form = useForm({
    resolver: zodResolver(productAttributeSchema),
    defaultValues: EMPTY_PRODUCTATTRIBUTE,
  });

  useEffect(() => {
    form.reset(
      productAttribute
        ? {
            product_id: productAttribute.product_id ? String(productAttribute.product_id) : "",
            attribute_name: productAttribute.attribute_name || "",
            attribute_value: productAttribute.attribute_value || "",
            data_type: productAttribute.data_type || "",
            is_filterable: productAttribute.is_filterable === true || productAttribute.is_filterable === "true",
            sort_order: productAttribute.sort_order ?? 0,
          }
        : EMPTY_PRODUCTATTRIBUTE
    );
  }, [productAttribute, form]);

  const onSubmit = (values) => {
    const payload = { ...values, product_id: Number.parseInt(values.product_id, 10) };
    onSave(isEditMode ? { ...payload, id: productAttribute.id } : payload);
  };

  return (
    <aside className="flex w-full shrink-0 animate-in flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card duration-200 fade-in slide-in-from-right-4 lg:w-85">
      <h2 className="font-display text-base font-semibold text-foreground">
        {isEditMode ? `Edit · ${productAttribute.attribute_name}` : "Add attribute"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
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
                      <SelectItem key={type} value={type} className="capitalize">
                        {type.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attribute_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input placeholder="Enter attribute value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <div className="flex-1">
                  <FormLabel className="cursor-pointer">Filterable</FormLabel>
                  <p className="text-xs text-muted-foreground">Show as a filter in the app</p>
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
                form.reset(EMPTY_PRODUCTATTRIBUTE);
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save" : "Add attribute"}</Button>
          </div>
        </form>
      </Form>
    </aside>
  );
};

export default ProductAttributePanel;
