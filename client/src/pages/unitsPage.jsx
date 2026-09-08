import { Search, Plus ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import UnitsTable from "@/components/freshly/unitsTable";
import useUnits from "@/hooks/use-units";
import { useNavigate } from "react-router-dom";
import UnitsModal from "@/components/freshly/unitsModal";
import ConfirmationModal from "@/components/common/confirmationModal";
import Pagination from "@/components/common/pagination";
const Units = () => {
  const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
    
  const navigate=useNavigate();
  const { unitsData,createMutation,updateMutation,deleteMutation,isLoading } = useUnits(currentPage,1);

  console.log("units page", unitsData);

  const units = unitsData?.data?.units ?? [];
  const pagination=unitsData?.data?.pagination??[];

    const openAddModal = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };
  const saveUnit = (payload) => {
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
    setIsModalOpen(false);
    setEditingUnit(null);
  };
    const handleDelete = (unitId) => {
    deleteMutation.mutate(unitId);
  };

  return (
    <div className="space-y-6 lg:space-y-7">
         <button
                type="button"
                onClick={() => navigate("/dashboard/products")}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1f2937]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
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
                placeholder="Search units..."
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
            Add Unit
          </button>
        </div>
      </div>

      <UnitsTable units={units}
         onEdit={openEditModal} 
           onDelete={handleDelete} 
           isLoading={isLoading} />
      <UnitsModal
 open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUnit(null);
        }}
        unit={editingUnit}
        onSave={saveUnit}
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

export default Units;