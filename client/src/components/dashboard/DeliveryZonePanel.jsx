import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const zoneSchema = z.object({
  code: z.string().min(1, "Enter a zone code"),
  name: z.string().min(1, "Enter a zone name"),
  city: z.string().min(1, "Enter a city"),
  postal_codes: z.string().optional().default(""),
  radius_km: z.coerce.number().min(0).optional(),
  delivery_fee: z.coerce.number().min(0).default(0),
  minimum_order_amount: z.coerce.number().min(0).default(0),
  estimated_delivery_time: z.coerce.number().min(0).optional(),
  is_active: z.boolean().default(true),
});

const EMPTY_ZONE = {
  code: "",
  name: "",
  city: "",
  postal_codes: "",
  radius_km: "",
  delivery_fee: 0,
  minimum_order_amount: 0,
  estimated_delivery_time: "",
  is_active: true,
};

// Inline edit panel next to the zones table (Zones.jsx), not a modal — `zone` null means "add new".
const DeliveryZonePanel = ({ zone, onCancel, onSave }) => {
  const isEditMode = Boolean(zone);

  const form = useForm({
    resolver: zodResolver(zoneSchema),
    defaultValues: EMPTY_ZONE,
  });

  useEffect(() => {
    form.reset(
      zone
        ? {
            code: zone.code || "",
            name: zone.name || "",
            city: zone.city || "",
            postal_codes: zone.postal_codes || "",
            radius_km: zone.radius_km ?? "",
            delivery_fee: zone.delivery_fee ?? 0,
            minimum_order_amount: zone.minimum_order_amount ?? 0,
            estimated_delivery_time: zone.estimated_delivery_time ?? "",
            is_active: zone.is_active ?? true,
          }
        : EMPTY_ZONE
    );
  }, [zone, form]);

  const onSubmit = (values) => {
    onSave(values);
  };

  return (
    <aside className="flex w-full shrink-0 animate-in flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-card duration-200 fade-in slide-in-from-right-4 lg:w-85">
      <h2 className="font-display text-base font-semibold text-foreground">
        {isEditMode ? `Edit · ${zone.name}` : "Add zone"}
      </h2>

      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
        <MapPin className="h-6 w-6" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Z-101" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="radius_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radius (km)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sector 35" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Chandigarh" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postal_codes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincodes</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Comma-separated, e.g. 160036, 160037" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="delivery_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery fee (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimum_order_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min order (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estimated_delivery_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated delivery (min)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="20" {...field} />
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
                  <p className="text-xs text-muted-foreground">Zone accepts new orders</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="mt-auto flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Save" : "Add zone"}</Button>
          </div>
        </form>
      </Form>
    </aside>
  );
};

export default DeliveryZonePanel;
