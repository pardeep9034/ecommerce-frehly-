import { Search, Plus ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import ReservationTable from "@/components/dashboard/ReservationTable";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/common/Pagination";
import useStockResvation from "@/hooks/use-stockReservation";
import MovementModal from "@/components/dashboard/MovementModal";

const StockReservationPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const [editingMovement, setEditingMovement] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
    
  const navigate=useNavigate();
  const { data,createMutation,isLoading,releaseMutation,confirmMutation } = useStockResvation({page: currentPage, limit: 10});
  const queryClient = useQueryClient();

  console.log("stock reservation", data);

  const reservations = data?.data?.stockReservations ?? [];
  const pagination=data?.data?.pagination??[];

    const openAddModal = () => {
    // setEditingMovement(null);
    setIsModalOpen(true);
  };

  // const openEditModal = (movement) => {
  //   setEditingMovement(movement);
  //   setIsModalOpen(true);
  // };
  const saveReservtion = (payload) => {
   
      createMutation.mutate(payload);
    
    setIsModalOpen(false);
    // setEditingMovement(null);
  };

  const handleConfirm = (reservation) => {
    if (!reservation?.id) return;
    const id = reservation.id;
    confirmMutation.mutate(id, {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: ["stockReservation", currentPage, 10] });
        const previous = queryClient.getQueryData(["stockReservation", currentPage, 10]);
        // optimistic update: set status to confirmed
        queryClient.setQueryData(["stockReservation", currentPage, 10], (old) => {
          if (!old) return old;
          try {
            const next = JSON.parse(JSON.stringify(old));
            if (next?.data?.stockReservations) {
              next.data.stockReservations = next.data.stockReservations.map((r) => r.id === id ? { ...r, status: 'confirmed' } : r);
            }
            return next;
          } catch (e) {
            return old;
          }
        });
        return { previous };
      },
      onError: (err, variables, context) => {
        toast.error('Unable to confirm reservation');
        if (context?.previous) {
          queryClient.setQueryData(["stockReservation", currentPage, 10], context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["stockReservation"] });
      }
    });
  }

  const handleRelease = (reservation) => {
    if (!reservation?.id) return;
    const id = reservation.id;
    releaseMutation.mutate(id, {
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: ["stockReservation", currentPage, 10] });
        const previous = queryClient.getQueryData(["stockReservation", currentPage, 10]);
        queryClient.setQueryData(["stockReservation", currentPage, 10], (old) => {
          if (!old) return old;
          try {
            const next = JSON.parse(JSON.stringify(old));
            if (next?.data?.stockReservations) {
              next.data.stockReservations = next.data.stockReservations.map((r) => r.id === id ? { ...r, status: 'released' } : r);
            }
            return next;
          } catch (e) {
            return old;
          }
        });
        return { previous };
      },
      onError: (err, variables, context) => {
        toast.error('Unable to release reservation');
        if (context?.previous) {
          queryClient.setQueryData(["stockReservation", currentPage, 10], context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["stockReservation"] });
      }
    });
  }
 

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
                placeholder="Search resrvation..."
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
            create reservation
          </button>
        </div>
      </div>

      <ReservationTable
        reservations={reservations}
        onConfirm={handleConfirm}
        onRelease={handleRelease}
        //  onEdit={openEditModal} 
        //    onDelete={handleDelete} 
        isLoading={isLoading}
      />
      <MovementModal
 open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        
        }}
    
        // onSave={saveMovement}
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

export default StockReservationPage;