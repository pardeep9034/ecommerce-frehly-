import { useState } from "react";
import { CheckCircle2, Loader2, Truck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAssignDelivery, useAvailablePartners, useDeliverySlots } from "@/hooks/use-delivery";

const DELIVERY_STEPS = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];

const partnerLabel = (partner) => {
  const vehicle = [partner.vehicle_type, partner.vehicle_number].filter(Boolean).join(" ");
  const distance = Number.isFinite(partner.distance) ? ` • ${partner.distance.toFixed(1)} km away` : "";
  const load = ` • ${partner.current_active_orders}/${partner.max_active_orders} active`;
  return `${vehicle || `Partner #${String(partner.id).slice(0, 8)}`}${distance}${load}`;
};

const slotLabel = (slot) => `${slot.name} (${slot.start_time} - ${slot.end_time})`;

const DeliveryProgress = ({ status }) => {
  const stepIndex = DELIVERY_STEPS.indexOf(status);

  if (status === "DELIVERY_FAILED") {
    return (
      <div className="rounded-xl border border-border bg-white px-5 py-4 text-sm font-medium text-destructive shadow-card sm:px-6">
        Delivery attempt failed — see delivery history for details.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        {DELIVERY_STEPS.map((step, index) => {
          const reached = stepIndex >= 0 && index <= stepIndex;
          return (
            <div key={step} className="flex flex-1 flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  reached ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {reached ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <p className={`mt-2 text-xs font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                {step.replaceAll("_", " ")}
              </p>
              {index < DELIVERY_STEPS.length - 1 && (
                <div className={`mt-4 h-0.5 w-full ${index < stepIndex ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Progresses automatically once a delivery partner is assigned — no further action needed.
      </p>
    </div>
  );
};

const DeliveryAssignmentTab = ({ order }) => {
  const [partnerId, setPartnerId] = useState("");
  const [slotId, setSlotId] = useState("");
  const needsAssignment = order.status === "READY_FOR_ASSIGNMENT";

  const { partners, isLoading: loadingPartners } = useAvailablePartners(needsAssignment);
  const { slots, isLoading: loadingSlots } = useDeliverySlots(needsAssignment);
  const assignDelivery = useAssignDelivery(order.id);

  if (!needsAssignment && !DELIVERY_STEPS.includes(order.status) && order.status !== "DELIVERY_FAILED") {
    return (
      <div className="rounded-xl border border-border bg-white px-5 py-4 text-sm text-muted-foreground shadow-card sm:px-6">
        This order isn&apos;t ready for delivery assignment yet (status: {order.status}).
      </div>
    );
  }

  if (!needsAssignment) {
    return <DeliveryProgress status={order.status} />;
  }

  const handleAssign = () => {
    if (!partnerId || !slotId) {
      toast.error("Pick a delivery partner and a delivery slot");
      return;
    }

    assignDelivery.mutate(
      {
        order_id: order.id,
        delivery_partner_id: partnerId,
        delivery_slot_id: slotId,
        assignment_source: "MANUAL",
      },
      {
        onSuccess: () => toast.success("Delivery partner assigned — progress will update automatically"),
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to assign delivery partner"),
      }
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold text-foreground">Assign Delivery Partner</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Delivery Partner</label>
          <select
            value={partnerId}
            onChange={(event) => setPartnerId(event.target.value)}
            disabled={loadingPartners}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{loadingPartners ? "Loading partners..." : "Select a partner"}</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partnerLabel(partner)}
              </option>
            ))}
          </select>
          {!loadingPartners && partners.length === 0 && (
            <p className="mt-1 text-xs text-warning-foreground">No available delivery partners in this warehouse&apos;s zone.</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Delivery Slot</label>
          <select
            value={slotId}
            onChange={(event) => setSlotId(event.target.value)}
            disabled={loadingSlots}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{loadingSlots ? "Loading slots..." : "Select a slot"}</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slotLabel(slot)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        disabled={!partnerId || !slotId || assignDelivery.isPending}
        onClick={handleAssign}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
          !partnerId || !slotId || assignDelivery.isPending ? "cursor-not-allowed bg-gray-300" : "bg-primary hover:bg-primary/90"
        }`}
      >
        {assignDelivery.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Assign &amp; Start Delivery
      </button>
    </div>
  );
};

export default DeliveryAssignmentTab;
