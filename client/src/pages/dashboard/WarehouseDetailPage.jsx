import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Users, Settings as SettingsIcon, LayoutGrid, UserPlus, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import WarehouseModal from "@/components/dashboard/WarehouseModal";
import WarehouseTeamTable from "@/components/dashboard/WarehouseTeamTable";
import AssignStaffModal from "@/components/dashboard/AssignStaffModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import useWarehouse, { useWarehouseDetail, useWarehouseTeam } from "@/hooks/use-warehouse";
import useStaff from "@/hooks/use-staff";

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutGrid },
  { value: "location", label: "Location", icon: MapPin },
  { value: "team", label: "Team", icon: Users },
  { value: "settings", label: "Settings", icon: SettingsIcon },
];

const WarehouseDetailPage = () => {
  const { warehouseId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  const { warehouse, isLoading } = useWarehouseDetail(warehouseId);
  const { updateMutation } = useWarehouse();
  const { team, assignMutation, removeMutation } = useWarehouseTeam(warehouseId);
  const { staff } = useStaff(1, 100);

  const enrichedTeam = useMemo(() => {
    const byId = new Map(staff.map((user) => [user.id, user]));
    return team.map((member) => {
      const user = byId.get(member.user_id);
      return {
        ...member,
        name: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : `User #${member.user_id}`,
        phone: user?.phone,
        role: user?.role,
      };
    });
  }, [team, staff]);

  const manager = enrichedTeam.find((member) => member.role === "ADMIN");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading warehouse...</p>;
  }

  if (!warehouse) {
    return <p className="text-sm text-muted-foreground">Warehouse not found.</p>;
  }

  const handleSaveEdit = (payload) => {
    updateMutation.mutate({ id: warehouseId, data: payload });
    setIsEditOpen(false);
  };

  const handleDeactivate = () => {
    updateMutation.mutate({ id: warehouseId, data: { is_active: !warehouse.is_active } });
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title={warehouse.name}
        description={`${warehouse.code} · ${warehouse.city || "—"}`}
        backTo="/dashboard/warehouses"
        backLabel="Back to Warehouses"
        action={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                warehouse.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {warehouse.is_active ? "Active" : "Inactive"}
            </span>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(true)}>
              Edit details
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <tab.icon className="mr-1.5 h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Contact person</p>
            <p className="mt-1 font-medium text-foreground">{warehouse.contact_person || "—"}</p>
            <p className="text-sm text-muted-foreground">{warehouse.contact_phone}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Manager</p>
            <p className="mt-1 font-medium text-foreground">{manager ? manager.name : "No manager assigned"}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Team size</p>
            <p className="mt-1 font-medium text-foreground">{enrichedTeam.length} staff</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-muted-foreground">
              Operational metrics (orders, pick &amp; pack time, throughput) will appear here once the backend
              aggregates order data per warehouse — see the backend implementation doc.
            </p>
          </div>
        </div>
      )}

      {activeTab === "location" && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-white p-6 shadow-card sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="mt-1 text-sm font-medium text-foreground">{warehouse.address}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">City / State / Country</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {[warehouse.city, warehouse.state, warehouse.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Zone</p>
            <p className="mt-1 text-sm font-medium text-foreground">{warehouse.zone_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Coordinates</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {warehouse.latitude}, {warehouse.longitude}
            </p>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => setIsAssignOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign staff
            </Button>
          </div>
          <WarehouseTeamTable team={enrichedTeam} onRemove={(member) => setRemovingMember(member)} />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
            <div>
              <p className="font-medium text-foreground">Warehouse active</p>
              <p className="text-sm text-muted-foreground">Turn off to stop routing new orders to this warehouse.</p>
            </div>
            <Switch checked={Boolean(warehouse.is_active)} onCheckedChange={handleDeactivate} />
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
            <p className="font-medium text-foreground">Store hours &amp; capacity</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Store open/close hours, pack-by target, max orders per slot and auto-assign-riders require new
              columns on the warehouse record. These controls will activate once the backend implements
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">PATCH /warehouses/:id/settings</code>
              — see the backend implementation doc for the exact contract.
            </p>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 shadow-card sm:p-6">
            <p className="font-medium text-destructive">Danger zone</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Deactivating a warehouse stops it from receiving new orders. This does not delete any data.
            </p>
            <Button type="button" variant="outline" className="mt-3 border-destructive text-destructive hover:bg-destructive/10" onClick={handleDeactivate}>
              {warehouse.is_active ? "Deactivate warehouse" : "Reactivate warehouse"}
            </Button>
          </div>
        </div>
      )}

      <WarehouseModal open={isEditOpen} onClose={() => setIsEditOpen(false)} warehouse={warehouse} onSave={handleSaveEdit} />

      <AssignStaffModal
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        team={enrichedTeam}
        onAssign={(userId) => {
          assignMutation.mutate(userId);
          setIsAssignOpen(false);
        }}
      />

      <ConfirmationModal
        open={Boolean(removingMember)}
        title={`Remove ${removingMember?.name || "this user"} from the team?`}
        cancelBtnName="Cancel"
        proceedBtnName="Remove"
        onClose={() => setRemovingMember(null)}
        onSuccess={() => {
          removeMutation.mutate(removingMember.user_id);
          setRemovingMember(null);
        }}
      />
    </div>
  );
};

export default WarehouseDetailPage;
