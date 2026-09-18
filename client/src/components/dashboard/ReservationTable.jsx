import { Check, Unlock } from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal"
import { toast } from "@/components/ui/sonner";
import { useState } from "react";

const ReservationTable = ({ reservations = [], onEdit, onDelete, onConfirm, onRelease, isLoading }) => {
  console.log("resvations ---------", reservations);
  const [isModalOpen,setIsModalOpen] =useState(false)
  const [pendingReservation,setPendingReservation] = useState(null)
  const [pendingAction,setPendingAction] = useState(null) // 'confirm' | 'release'

  const openConfirmation = (action, reservation) => {
    setPendingReservation(reservation)
    setPendingAction(action)
    setIsModalOpen(true)
  }

  const closeConfirmation = () => {
    setIsModalOpen(false)
    setPendingReservation(null)
    setPendingAction(null)
  }

  const handleProceed = () => {
    if (!pendingReservation || !pendingAction) return closeConfirmation()

    if (pendingAction === "confirm") {
      onConfirm?.(pendingReservation)
    } else if (pendingAction === "release") {
      onRelease?.(pendingReservation)
    }

    closeConfirmation()
  }
//   const [deleteUnit,setDeleteUnit]=useState(null)
//   if(isLoading){
//     return (<span className="text-sm text-gray-500">
//     Loading...
//   </span>)
//   }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
              <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                created at
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                order id
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                variant id
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                warehouse id
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                quantity
              </th>
             
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                status
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                updated at
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">
                Actions
              </th>

                        {/* <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">
                            Actions
                        </th> */}
            </tr>
          </thead>

          <tbody>
            {reservations.map((reservation) => (
              <tr
                key={reservation.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted"
              >
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {new Date(reservation.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {reservation.order_id}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {reservation.variant_id}
                  </span>
                </td>

                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {reservation.warehouse_id}
                </td>
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {reservation.quantity}
                </td>
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {reservation.status}
                </td>

                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {new Date(reservation.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-2">
                    {(() => {
                      const status = String(reservation.status || "").toLowerCase();
                      const confirmDisabled = status === "confirmed";
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmDisabled) {
                              toast.error(`Reservation already ${reservation.status}`);
                              return;
                            }
                            openConfirmation("confirm", reservation);
                          }}
                          disabled={confirmDisabled}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium text-white ${confirmDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-success hover:bg-success'}`}
                        >
                          <Check className="h-4 w-4" />
                          Confirm
                        </button>
                      )
                    })()}

                    {(() => {
                      const status = String(reservation.status || "").toLowerCase();
                      const releaseDisabled = status === "released";
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (releaseDisabled) {
                              toast.error(`Reservation already ${reservation.status}`);
                              return;
                            }
                            openConfirmation("release", reservation);
                          }}
                          disabled={releaseDisabled}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium text-white ${releaseDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                        >
                          <Unlock className="h-4 w-4" />
                          Release
                        </button>
                      )
                    })()}
                  </div>
                </td>
              </tr>
            ))}

            {reservations.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No Reservation found.
                </td>
              </tr>
            )}

            {isLoading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  Loading ...
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
        
  
    <ConfirmationModal
      open={isModalOpen}
      onClose={closeConfirmation}
      onSuccess={handleProceed}
      title={pendingAction === "release" ? "Release reservation?" : "Confirm reservation?"}
      cancelBtnName="Cancel"
      proceedBtnName={pendingAction === "release" ? "Release" : "Confirm"}
    />
      </div>
  );
};

export default ReservationTable;