import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const PROMOTION_TYPES = ["HOT", "POPULAR", "DISCOUNT"];
const DISCOUNT_TYPES = ["PERCENT", "FLAT"];

const promotionSchema = z.object({
  title: z.string().min(1, "Enter a title"),
  type: z.string().min(1, "Select a promotion type"),
  discountType: z.string().min(1, "Select a discount type"),
  discountValue: z.coerce.number({ invalid_type_error: "Enter a discount value" }).min(0, "Enter a discount value"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().min(1, "Enter a priority").default(1),
});

const EMPTY_PROMOTION = {
  title: "",
  type: "HOT",
  discountType: "PERCENT",
  discountValue: "",
  startDate: "",
  endDate: "",
  isActive: true,
  priority: 1,
};

const PromotionModal = ({ open, onClose, promotion, onSave }) => {
  const isEditMode = Boolean(promotion);

  const form = useForm({
    resolver: zodResolver(promotionSchema),
    defaultValues: EMPTY_PROMOTION,
  });

  useEffect(() => {
    if (promotion) {
      form.reset({
        title: promotion.title || "",
        type: promotion.type || "HOT",
        discountType: promotion.discountType || "PERCENT",
        discountValue: promotion.discountValue ?? "",
        startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : "",
        endDate: promotion.endDate ? promotion.endDate.slice(0, 10) : "",
        isActive: promotion.isActive ?? true,
        priority: promotion.priority ?? 1,
      });
      return;
    }
    form.reset(EMPTY_PROMOTION);
  }, [promotion, open]);

  if (!open) {
    return null;
  }

  const onSubmit = (values) => {
    onSave({
      ...values,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    });
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
            {isEditMode ? "Edit Promotion" : "Add Promotion"}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Summer HOT Deals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type + Discount Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotion type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select promotion type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROMOTION_TYPES.map((type) => (
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

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISCOUNT_TYPES.map((type) => (
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

            {/* Discount Value + Priority */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount value</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="e.g. 20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active Toggle */}
            <FormField
              control={form.control}
              name="isActive"
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
              <Button type="submit">{isEditMode ? "Save changes" : "Create promotion"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PromotionModal;
