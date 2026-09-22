import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const warehouseSchema = z.object({
  name: z.string().min(1, "Enter a warehouse name"),
  code: z.string().min(1, "Enter a warehouse code"),
  zone_id: z.coerce.string().min(1, "Select a zone"),
  address: z.string().min(1, "Enter an address"),
  city: z.string().min(1, "Enter a city"),
  state: z.string().min(1, "Enter a state"),
  country: z.string().min(1, "Enter a country"),
  latitude: z.coerce.number({ invalid_type_error: "Enter a latitude" }),
  longitude: z.coerce.number({ invalid_type_error: "Enter a longitude" }),
  contact_person: z.string().min(1, "Enter a contact person"),
  contact_phone: z.string().min(1, "Enter a contact phone"),
  is_active: z.boolean().default(true),
});

const EMPTY_WAREHOUSE = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zone_id: "",
  latitude: "",
  longitude: "",
  contact_person: "",
  contact_phone: "",
  is_active: true,
};

const WarehouseModal = ({ open, onClose, warehouse, onSave }) => {
  const isEditMode = Boolean(warehouse);
  const { deliveryZonesData } = useDeliveryZone(1, 10);
  const zonesList = deliveryZonesData?.data?.deliveryZones ?? [];

  const form = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: EMPTY_WAREHOUSE,
  });

  useEffect(() => {
    if (warehouse) {
      form.reset({
        name: warehouse.name || "",
        code: warehouse.code || "",
        address: warehouse.address || "",
        city: warehouse.city || "",
        state: warehouse.state || "",
        country: warehouse.country || "",
        zone_id: warehouse.zone_id ? String(warehouse.zone_id) : "",
        latitude: warehouse.latitude ?? "",
        longitude: warehouse.longitude ?? "",
        contact_person: warehouse.contact_person || "",
        contact_phone: warehouse.contact_phone || "",
        is_active: Boolean(warehouse.is_active),
      });
      return;
    }
    form.reset(EMPTY_WAREHOUSE);
  }, [warehouse, open]);

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
            {isEditMode ? "Edit Warehouse" : "Add Warehouse"}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter warehouse name" {...field} />
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
                      <Input placeholder="Enter warehouse code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="zone_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone</FormLabel>
                  <FormControl>
                    <SearchableSelector
                      id={field.name}
                      ref={field.ref}
                      data={zonesList}
                      placeholder="Select a zone"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter warehouse address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter warehouse city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter warehouse state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter warehouse country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Enter warehouse latitude" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Enter warehouse longitude" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact person</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact person phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active Toggle */}
            <FormField
              control={form.control}
              name="is_active"
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
              <Button type="submit">{isEditMode ? "Save changes" : "Add warehouse"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default WarehouseModal;
