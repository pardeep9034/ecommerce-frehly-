import { Search, Plus } from "lucide-react";
import { useState } from "react";
import WarehousesTable from "@/components/dashboard/WarehousesTable";
import WarehouseModal from "@/components/dashboard/WarehouseModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Pagination from "@/components/common/Pagination";
import useWarehouse from "@/hooks/use-warehouse";
import PageHeader from "@/components/dashboard/PageHeader";
const WarehousePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
//   const { unitsData,createMutation,updateMutation,deleteMutation,isLoading } = useUnits(currentPage,1);
  const{warehouses,pagination,deleteMutation,createMutation,updateMutation,isLoading}=useWarehouse(currentPage,1)

  console.log("warehouses page", warehouses);

//   const units = unitsData?.data?.units ?? [];
//   const pagination=unitsData?.data?.pagination??[];

    const openAddModal = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };
  const saveWarehouse = (payload) => {
    console.log("saveWarehouse payload", payload);
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

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Warehouses"
        description="Manage the warehouses that store your inventory."
        backTo="/dashboard/inventory"
        backLabel="Back to Inventory"
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
      <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
            }}
            placeholder="Search warehouses..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <WarehousesTable warehouses={warehouses}
         onEdit={openEditModal} 
           onDelete={handleDelete} 
           isLoading={isLoading} />
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