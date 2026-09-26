import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const brandSchema = z.object({
  name: z.string().min(1, "Enter a brand name"),
  logo_url: z.string().optional().default(""),
  description: z.string().min(1, "Enter a description"),
  is_active: z.boolean().default(true),
});

const EMPTY_BRAND = {
  name: "",
  logo_url: "",
  description: "",
  is_active: true,
};

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

// Inline edit panel next to the brand table (BrandPage), not a modal — `brand` null means "add new".
const BrandModal = ({ brand, onCancel, onSave }) => {
  const isEditMode = Boolean(brand);

  const form = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: EMPTY_BRAND,
  });

  useEffect(() => {
    form.reset(
      brand
        ? {
            name: brand.name || "",
            logo_url: brand.logo_url || "",
            description: brand.description || "",
            is_active: Boolean(brand.is_active),
          }
        : EMPTY_BRAND
    );
  }, [brand, form]);

  const onSubmit = (values) => {
    onSave(isEditMode ? { ...values, id: brand.id } : values);
  };

  const name = form.watch("name");
  const logoUrl = form.watch("logo_url");

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card lg:w-85">
      <h2 className="font-display text-base font-semibold text-foreground">
        {isEditMode ? `Edit · ${brand.name}` : "Add brand"}
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
                  <Input placeholder="Enter brand name" {...field} />
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
                  <Textarea rows={3} placeholder="Enter brand description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-sm font-bold text-accent-foreground">
                      {initials(name) || "?"}
                    </span>
                  )}
                  <FormControl>
                    <Input placeholder="Logo URL" {...field} />
                  </FormControl>
                </div>
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
                  <p className="text-xs text-muted-foreground">Brand can be picked on products</p>
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
                form.reset(EMPTY_BRAND);
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save" : "Add brand"}</Button>
          </div>
        </form>
      </Form>
    </aside>
  );
};

export default BrandModal;
