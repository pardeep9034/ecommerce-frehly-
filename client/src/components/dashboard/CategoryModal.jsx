import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import useCategory from "@/hooks/use-category";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const categorySchema = z.object({
  name: z.string().min(1, "Enter a category name"),
  parent_id: z.coerce.string().optional().default(""),
  image_url: z.string().optional().default(""),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
});

const EMPTY_CATEGORY = {
  name: "",
  parent_id: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

const CategoryModal = ({ open, onClose, category, onSave }) => {
  const isEditMode = Boolean(category);
  const [searchTerm, setSearchTerm] = useState("");
  const { allCategories } = useCategory(1, 10, searchTerm);
  const categoriesList = (allCategories?.data?.categories || []).filter((item) => item.id !== category?.id);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_CATEGORY,
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || "",
        parent_id: category.parent_id ? String(category.parent_id) : "",
        image_url: category.image_url || "",
        is_active: Boolean(category.is_active),
        sort_order: category.sort_order ?? 0,
      });
      return;
    }
    form.reset(EMPTY_CATEGORY);
  }, [category, open]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    const payload = { ...values, parent_id: values.parent_id || null };
    onSave(isEditMode ? { ...payload, id: category.id } : payload);
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
            {isEditMode ? "Edit Category" : "Add Category"}
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
                  <FormLabel>Category name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent category</FormLabel>
                  <FormControl>
                    <SearchableSelector
                      id={field.name}
                      ref={field.ref}
                      data={categoriesList}
                      labelKey="name"
                      valueKey="id"
                      placeholder="Select parent category"
                      value={field.value}
                      onSelect={field.onChange}
                      onSearchChange={(q) => setSearchTerm(q)}
                      serverSearch={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter image URL" {...field} />
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
                      <Input type="number" placeholder="Enter sort order" {...field} />
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
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? "Save changes" : "Add category"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CategoryModal;
