import { Search, Plus, Building2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WarehousesTable from "@/components/dashboard/WarehousesTable";
import WarehouseModal from "@/components/dashboard/WarehouseModal";
import Pagination from "@/components/common/Pagination";
import useWarehouse from "@/hooks/use-warehouse";
import PageHeader from "@/components/dashboard/PageHeader";

const WarehousePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { warehouses, pagination, deleteMutation, createMutation, updateMutation, isLoading } = useWarehouse(
    currentPage,
    10
  );

  const activeCount = warehouses.filter((w) => w.is_active).length;
  const inactiveCount = warehouses.length - activeCount;

  const openAddModal = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const saveWarehouse = (payload) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setIsModalOpen(false);
    setEditingWarehouse(null);
  };

  const handleDelete = (warehouseId) => {
    deleteMutation.mutate(warehouseId);
  };

  const handleView = (warehouse) => {
    navigate(`/dashboard/warehouses/${warehouse.id}`);
  };

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      warehouse.name?.toLowerCase().includes(term) ||
      warehouse.code?.toLowerCase().includes(term) ||
      warehouse.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Warehouses"
        description="Manage the warehouses that store your inventory."
        action={
          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Warehouse
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Total warehouses</p>
            <p className="text-xl font-semibold text-foreground">{pagination?.totalItems ?? warehouses.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-xl font-semibold text-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <XCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">Inactive</p>
            <p className="text-xl font-semibold text-foreground">{inactiveCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search warehouses..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <WarehousesTable
        warehouses={filteredWarehouses}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />
      <WarehouseModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWarehouse(null);
        }}
        warehouse={editingWarehouse}
        onSave={saveWarehouse}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={pagination?.totalPages ?? 0}
        totalItems={pagination?.totalItems ?? 0}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default WarehousePage;
