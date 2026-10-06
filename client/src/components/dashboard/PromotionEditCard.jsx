import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

// The "Promotion" card on PromotionDetail — same fields as PromotionModal
// (the list page's popup), rendered inline instead, matching the design's
// left-column edit card.
const PromotionEditCard = ({ promotion, status, onSave }) => {
  const form = useForm({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      title: promotion.title || "",
      type: promotion.type || "HOT",
      discountType: promotion.discountType || "PERCENT",
      discountValue: promotion.discountValue ?? "",
      startDate: promotion.startDate ? promotion.startDate.slice(0, 10) : "",
      endDate: promotion.endDate ? promotion.endDate.slice(0, 10) : "",
      isActive: promotion.isActive ?? true,
      priority: promotion.priority ?? 1,
    },
  });

  useEffect(() => {
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
  }, [promotion, form]);

  const onSubmit = (values) => {
    onSave({ ...values, startDate: values.startDate || null, endDate: values.endDate || null });
  };

  const STATUS_STYLES = {
    Live: "bg-success/10 text-success",
    Scheduled: "bg-blue-50 text-blue-600",
    Ended: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Promotion</h2>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
          {status}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger id={field.name}>
                        <SelectValue />
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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger id={field.name}>
                        <SelectValue />
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

            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts</FormLabel>
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
                  <FormLabel>Ends</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                <div className="flex-1">
                  <FormLabel className="cursor-pointer">Active</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PromotionEditCard;
