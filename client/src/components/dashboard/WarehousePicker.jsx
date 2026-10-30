import { Warehouse } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useWarehouse from "@/hooks/use-warehouse";
import { useSelectedWarehouse } from "@/hooks/use-selected-warehouse";

// Dropdown to switch the active warehouse (same Select as the Products filters). No "All" option on purpose —
// see use-selected-warehouse.js.
export const WarehouseSelect = ({ className = "" }) => {
  const { warehouseId, setWarehouseId, locked } = useSelectedWarehouse();
  const { warehouses } = useWarehouse(1, 100);

  // A store account works in its own store only: show it, nothing to switch.
  if (locked) {
    return (
      <span className={`inline-flex items-center gap-2 text-sm font-medium text-foreground ${className}`}>
        <Warehouse className="h-4 w-4 text-primary" aria-hidden="true" />
        {warehouses.find((warehouse) => String(warehouse.id) === warehouseId)?.name ?? "Your store"}
      </span>
    );
  }

  return (
    <Select value={warehouseId} onValueChange={setWarehouseId}>
      <SelectTrigger className={`min-w-37.5 py-2.5 ${className}`} aria-label="Warehouse">
        <SelectValue placeholder="Select warehouse">
          {warehouses.find((warehouse) => String(warehouse.id) === warehouseId)?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {warehouses.map((warehouse) => (
          <SelectItem key={warehouse.id} value={String(warehouse.id)}>
            {warehouse.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Blocking popup shown while no warehouse is chosen; it can't be dismissed without picking one.
export const WarehousePickerDialog = () => {
  const { warehouseId, setWarehouseId, locked } = useSelectedWarehouse();
  const { warehouses: allWarehouses, isLoading } = useWarehouse(1, 100);
  // Locked with no store: the account isn't assigned to one yet, so there is nothing to pick.
  const warehouses = locked ? [] : allWarehouses;

  return (
    <Dialog open={!warehouseId}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Select a warehouse</DialogTitle>
          <DialogDescription>Orders are shown one warehouse at a time. You can switch later from the top of the page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading warehouses...</p>}
          {locked && <p className="text-sm text-muted-foreground">No store is assigned to your account yet. Ask the super admin to assign you to one.</p>}
          {!locked && !isLoading && warehouses.length === 0 && <p className="text-sm text-muted-foreground">No warehouses found. Create one first.</p>}
          {warehouses.map((warehouse) => (
            <button
              key={warehouse.id}
              type="button"
              onClick={() => setWarehouseId(warehouse.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Warehouse className="h-4 w-4 text-primary" />
              {warehouse.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
