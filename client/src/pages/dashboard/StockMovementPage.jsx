import { Search, Plus ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import MovementTable from "@/components/dashboard/MovementTable";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/common/Pagination";
import useStockMovement from "@/hooks/use-stockMovement";
import MovementModal from "@/components/dashboard/MovementModal";

const StockMovementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMovement, setEditingMovement] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
    
  const navigate=useNavigate();
  const { stockMovements,createMutation,isLoading } = useStockMovement(currentPage,10);

  console.log("stock movements", stockMovements);

  const movements = stockMovements?.data?.stockMovements ?? [];
  const pagination=stockMovements?.data?.pagination??[];

    const openAddModal = () => {
    setEditingMovement(null);
    setIsModalOpen(true);
  };

  // const openEditModal = (movement) => {
  //   setEditingMovement(movement);
  //   setIsModalOpen(true);
  // };
  const saveMovement = (payload) => {
   
      createMutation.mutate(payload);
    
    setIsModalOpen(false);
    setEditingMovement(null);
  };
 

  return (
    <div className="space-y-6 lg:space-y-7">
         <button
                type="button"
                onClick={() => navigate("/dashboard/inventory")}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </button>
      <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
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

          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add stock
          </button>
        </div>
      </div>

      <MovementTable
       movements={movements}
        //  onEdit={openEditModal} 
        //    onDelete={handleDelete} 
           isLoading={isLoading} />
      <MovementModal
 open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        
        }}
    
        onSave={saveMovement}
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

export default StockMovementPage;