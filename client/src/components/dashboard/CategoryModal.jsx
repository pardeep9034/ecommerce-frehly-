import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useCategory from "@/hooks/use-category";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

// Inline edit panel next to the category table (Categories page), not a modal — `category` null means "add new".
const CategoryModal = ({ category, onCancel, onSave }) => {
  const isEditMode = Boolean(category);
  const [searchTerm, setSearchTerm] = useState("");
  const { allCategories } = useCategory(searchTerm);
  const categoriesList = (allCategories?.data?.categories || []).filter((item) => item.id !== category?.id);

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_CATEGORY,
  });

  useEffect(() => {
    form.reset(
      category
        ? {
            name: category.name || "",
            parent_id: category.parent_id ? String(category.parent_id) : "",
            image_url: category.image_url || "",
            is_active: Boolean(category.is_active),
            sort_order: category.sort_order ?? 0,
          }
        : EMPTY_CATEGORY
    );
  }, [category, form]);

  const onSubmit = (values) => {
    const payload = { ...values, parent_id: values.parent_id || null };
    onSave(isEditMode ? { ...payload, id: category.id } : payload);
  };

  const name = form.watch("name");
  const imageUrl = form.watch("image_url");

  return (
    <aside className="flex w-full shrink-0 animate-in flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card duration-200 fade-in slide-in-from-right-4 lg:w-85">
      <h2 className="font-display text-base font-semibold text-foreground">
        {isEditMode ? `Edit · ${category.name}` : "Add category"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
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
                    placeholder="None · top level"
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
                <FormLabel>Image</FormLabel>
                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-primary">
                      {initials(name) || "?"}
                    </span>
                  )}
                  <FormControl>
                    <Input placeholder="Image URL" {...field} />
                  </FormControl>
                </div>
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
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground">Lower numbers show first in the app</p>
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
                  <p className="text-xs text-muted-foreground">Visible in the customer app</p>
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
                form.reset(EMPTY_CATEGORY);
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save" : "Add category"}</Button>
          </div>
        </form>
      </Form>
    </aside>
  );
};

export default CategoryModal;
