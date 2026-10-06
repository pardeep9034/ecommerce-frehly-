import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = ["WEIGHT", "VOLUME", "COUNT", "PACKAGING"];

const unitSchema = z.object({
  name: z.string().min(1, "Enter a unit name"),
  code: z.string().min(1, "Enter a unit code"),
  category: z.string().min(1, "Select a category"),
  is_active: z.boolean().default(true),
});

const EMPTY_UNITS = {
  name: "",
  code: "",
  category: "",
  is_active: true,
};

// Inline edit panel next to the units table (UnitsPage), not a modal — `unit` null means "add new".
const UnitsModal = ({ unit, onCancel, onSave }) => {
  const isEditMode = Boolean(unit);

  const form = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: EMPTY_UNITS,
  });

  useEffect(() => {
    form.reset(
      unit
        ? {
            name: unit.name || "",
            code: unit.code || "",
            category: unit.category || "",
            is_active: Boolean(unit.is_active),
          }
        : EMPTY_UNITS
    );
  }, [unit, form]);

  const onSubmit = (values) => {
    onSave(isEditMode ? { ...values, id: unit.id } : values);
  };

  return (
    <aside className="flex w-full shrink-0 animate-in flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card duration-200 fade-in slide-in-from-right-4 lg:w-85">
      <h2 className="font-display text-base font-semibold text-foreground">
        {isEditMode ? `Edit · ${unit.name}` : "Add unit"}
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
                  <Input placeholder="Enter unit name" {...field} />
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
                  <Input placeholder="Enter unit code" {...field} />
                </FormControl>
                <FormDescription>Shown next to quantities, e.g. 1 kg</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="capitalize">
                        {option.toLowerCase()}
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
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                <div className="flex-1">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                  <p className="text-xs text-muted-foreground">Can be used on variants</p>
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
                form.reset(EMPTY_UNITS);
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save" : "Add unit"}</Button>
          </div>
        </form>
      </Form>
    </aside>
  );
};

export default UnitsModal;
