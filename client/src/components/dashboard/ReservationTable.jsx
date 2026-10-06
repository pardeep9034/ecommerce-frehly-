import { Check, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { toast } from "@/components/ui/sonner";
import { useState } from "react";

const STATUS_STYLES = {
  ACTIVE: "bg-blue-50 text-blue-600",
  CONFIRMED: "bg-success/10 text-success",
  RELEASED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-destructive/10 text-destructive",
};

const ReservationTable = ({ reservations = [], variantNames = {}, warehouseNames = {}, onConfirm, onRelease, isLoading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingReservation, setPendingReservation] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'confirm' | 'release'

  const openConfirmation = (action, reservation) => {
    setPendingReservation(reservation);
    setPendingAction(action);
    setIsModalOpen(true);
  };

  const closeConfirmation = () => {
    setIsModalOpen(false);
    setPendingReservation(null);
    setPendingAction(null);
  };

  const handleProceed = () => {
    if (!pendingReservation || !pendingAction) return closeConfirmation();
    if (pendingAction === "confirm") onConfirm?.(pendingReservation);
    else if (pendingAction === "release") onRelease?.(pendingReservation);
    closeConfirmation();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Order</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Variant</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Warehouse</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Qty</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Expires</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map((reservation) => {
              const status = String(reservation.status || "").toUpperCase();
              const confirmDisabled = status !== "ACTIVE";
              const releaseDisabled = status !== "ACTIVE";
              return (
                <tr key={reservation.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                  <td className="px-5 py-4 sm:px-6">
                    <Link to={`/dashboard/orders/${reservation.order_id}`} className="font-medium text-primary hover:underline">
                      #{reservation.order_id}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                    {variantNames[reservation.variant_id] || `Variant #${reservation.variant_id}`}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">
                    {warehouseNames[reservation.warehouse_id] || `#${reservation.warehouse_id}`}
                  </td>
                  <td className="px-5 py-4 font-medium text-foreground sm:px-6">{reservation.quantity}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
                      {status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground sm:px-6">
                    {reservation.expires_at
                      ? new Date(reservation.expires_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmDisabled) {
                            toast.error(`Reservation already ${status.toLowerCase()}`);
                            return;
                          }
                          openConfirmation("confirm", reservation);
                        }}
                        disabled={confirmDisabled}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-white ${confirmDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-success hover:bg-success/90"}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (releaseDisabled) {
                            toast.error(`Reservation already ${status.toLowerCase()}`);
                            return;
                          }
                          openConfirmation("release", reservation);
                        }}
                        disabled={releaseDisabled}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-white ${releaseDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Release
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {reservations.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No reservations found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Loading...
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
