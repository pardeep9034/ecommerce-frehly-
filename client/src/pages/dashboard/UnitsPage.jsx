import { Search, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import UnitsTable from "@/components/dashboard/UnitsTable";
import useUnits from "@/hooks/use-units";
import UnitsModal from "@/components/dashboard/UnitsModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";
const UnitsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);

  const { unitsData,createMutation,updateMutation,deleteMutation,isLoading } = useUnits(currentPage,1);

  console.log("units page", unitsData);
    const units = unitsData?.data?.units ?? [];
  const pagination=unitsData?.data?.pagination??[];

  const filteredUnits=useMemo(()=>{
    return units.filter((item)=>{
      const searchMatch=item.code.toString().includes(searchTerm.toLowerCase())

      return searchMatch;
    })

  },[unitsData,searchTerm])


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
      <PageHeader
        title="Units"
        description="Define measurement units used across product variants."
        backTo="/dashboard/products"
        backLabel="Back to Products"
        action={
          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Unit
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
            placeholder="Search units..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <UnitsTable units={filteredUnits}
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

export default UnitsPage;