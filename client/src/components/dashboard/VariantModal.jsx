import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import useUnits from "@/hooks/use-units";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", dot: "bg-success" },
  { value: "INACTIVE", label: "Inactive", dot: "bg-warning" },
  { value: "ARCHIVED", label: "Archived", dot: "bg-destructive" },
];

const UNIT_TYPE_OPTIONS = ["WEIGHT", "VOLUME", "COUNT", "PACKAGING"];

const variantSchema = z.object({
  unitType: z.string().min(1, "Select a unit type"),
  measurement_unit_id: z.string().min(1, "Select a unit"),
  quantity: z.coerce.number({ invalid_type_error: "Enter a value" }).gt(0, "Enter a value"),
  price: z.coerce.number({ invalid_type_error: "Enter a price" }).min(0, "Enter a price"),
  mrp: z.coerce.number({ invalid_type_error: "Enter an MRP" }).min(0, "Enter an MRP"),
  barcode: z.string().optional().default(""),
  status: z.string().optional().default(""),
});

const EMPTY_VARIANT = {
  unitType: "",
  measurement_unit_id: "",
  quantity: "",
  price: "",
  mrp: "",
  barcode: "",
  status: "",
};

const VariantModal = ({ open, onClose, variant, onSave }) => {
  const isEditMode = Boolean(variant);
  const { unitsData } = useUnits();
  const units = unitsData?.data?.units || [];

  const unitsByCategory = units.reduce((acc, unit) => {
    if (!acc[unit.category]) acc[unit.category] = [];
    acc[unit.category].push(unit);
    return acc;
  }, {});

  const form = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: EMPTY_VARIANT,
  });

  const unitType = form.watch("unitType");
  const availableUnits = unitsByCategory[unitType] || [];

  useEffect(() => {
    if (variant) {
      form.reset({
        unitType: variant.measurementUnit?.category ?? "",
        measurement_unit_id: String(variant.measurementUnit?.id ?? ""),
        quantity: String(variant.quantity ?? ""),
        price: String(variant.price ?? ""),
        mrp: String(variant.mrp ?? ""),
        barcode: variant.barcode ?? "",
        status: variant.status ?? "ARCHIVED",
      });
      return;
    }

    form.reset(EMPTY_VARIANT);
  }, [variant, open]);

  if (!open) {
    return null;
  }

  const onUnitTypeChange = (value) => {
    const categoryUnits = unitsByCategory[value] || [];
    form.setValue("unitType", value);
    form.setValue("measurement_unit_id", categoryUnits.length > 0 ? String(categoryUnits[0].id) : "");
  };

  const onSubmit = (values) => {
    onSave({
      quantity: values.quantity,
      price: values.price,
      mrp: values.mrp,
      measurement_unit_id: Number.parseInt(values.measurement_unit_id, 10),
      status: values.status || "ARCHIVED",
      barcode: values.barcode,
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
            {isEditMode ? "Edit Variant" : "Add Variant"}
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
            {/* Unit Type + Unit */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) onUnitTypeChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_TYPE_OPTIONS.map((type) => (
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
                name="measurement_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      disabled={!unitType || availableUnits.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <SelectValue
                            placeholder={!unitType ? "Select unit type first" : "No units available"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={String(unit.id)}>
                            {unit.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Value */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={unitType === "PACKAGING" ? "Items in pack" : "e.g. 500"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price + MRP */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Barcode */}
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter barcode" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      // See ProductModal: Radix's hidden native <select> echoes a
                      // spurious "" change event when the value is set
                      // programmatically (via form.reset). Ignore it.
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? "Save changes" : "Add variant"}</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default VariantModal;
