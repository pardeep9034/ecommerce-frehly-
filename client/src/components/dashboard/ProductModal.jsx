import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import useCategory from "@/hooks/use-category";
import useProductType from "@/hooks/use-productType";
import useBrand from "@/hooks/use-brand";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", dot: "bg-muted-foreground" },
  { value: "ACTIVE", label: "Active", dot: "bg-success" },
  { value: "INACTIVE", label: "Inactive", dot: "bg-warning" },
  { value: "ARCHIVED", label: "Archived", dot: "bg-destructive" },
];

const productSchema = z.object({
  name: z.string().min(1, "Enter a product name"),
  short_description: z.string().min(1, "Enter a short description"),
  description: z.string().optional().default(""),
  category_id: z.coerce.string().min(1, "Select a category"),
  product_type_id: z.coerce.string().optional().default(""),
  brand_id: z.coerce.string().optional().default(""),
  status: z.string().optional().default(""),
  is_organic: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
});

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  category_id: "",
  product_type_id: "",
  brand_id: "",
  short_description: "",
  is_organic: false,
  is_featured: false,
  sort_order: 0,
  status: "",
};

const ProductModal = ({ open, onClose, product, onSave }) => {
  const isEditMode = Boolean(product);
  const { categories: categoriesData } = useCategory();
  const { data } = useProductType();
  const { brandsData } = useBrand();

  const categoriesList = categoriesData?.data?.categories;
  const productTypesList = data?.data?.productTypes;
  const brandsList = brandsData?.data?.brand;

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY_PRODUCT,
  });

  useEffect(() => {
    form.reset(product || EMPTY_PRODUCT);
  }, [product, open]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    onSave(values);
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
            {isEditMode ? "Edit Product" : "Add Product"}
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
                  <FormLabel>Product name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Enter product short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Enter product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category & Product Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={categoriesList}
                        labelKey="name"
                        valueKey="id"
                        placeholder="Search category"
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
                name="product_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product type</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={productTypesList}
                        placeholder="Search product type"
                        value={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Brand & Status */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="brand_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={brandsList}
                        placeholder="Search brand"
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        // Radix's hidden native <select> (used for form/autofill
                        // integration) echoes a spurious "" change event when the
                        // controlled value is set programmatically (e.g. via
                        // form.reset) before its options are done syncing. None of
                        // our statuses is ever "", so treat an empty value as that
                        // echo and ignore it instead of clobbering the real value.
                        if (value) field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <span className="flex items-center gap-2">
                            {field.value && (
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  STATUS_OPTIONS.find((opt) => opt.value === field.value)?.dot
                                }`}
                              />
                            )}
                            <SelectValue placeholder="Select status">
                              {STATUS_OPTIONS.find((opt) => opt.value === field.value)?.label}
                            </SelectValue>
                          </span>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${opt.dot}`} />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Organic Toggle */}
            <FormField
              control={form.control}
              name="is_organic"
              render={({ field }) => (
                <FormItem className="mt-2 flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Organic product</FormLabel>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Save changes" : "Add product"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProductModal;
