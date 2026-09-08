import { Search, Plus ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import WarehousesTable from "@/components/freshly/warehouseTable";
import { useNavigate } from "react-router-dom";
import WarehousesModal from "@/components/freshly/warehouseModal";
import ConfirmationModal from "@/components/common/confirmationModal";
import Pagination from "@/components/common/pagination";
import useWarehouse from "@/hooks/use-warehouse";
const warehouse = () => {
  const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
    
  const navigate=useNavigate();
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
         <button
                type="button"
                onClick={() => navigate("/dashboard/inventory")}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1f2937]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </button>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 text-[#6b7280]" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search warehouses..."
                className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
              />
            </div>
          </div>

          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
          >
            <Plus className="h-4 w-4" />
            Add Warehouse
          </button>
        </div>
      </div>

      <WarehousesTable warehouses={warehouses}
         onEdit={openEditModal} 
           onDelete={handleDelete} 
           isLoading={isLoading} />
      <WarehousesModal
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

export default warehouse;