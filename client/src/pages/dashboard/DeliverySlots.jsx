import { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/partner/PartnerBits";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSlotAdmin } from "@/hooks/use-delivery";
import { notify } from "@/lib/notify";

const INPUT = "mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";
const GHOST = "h-9 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
const SOLID = "h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground";

// "14:30:00" -> "2:30 PM"
const clock = (time) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const SlotDialog = ({ slot, onClose, create, update }) => {
  const [form, setForm] = useState({
    name: slot?.name ?? "",
    start_time: slot?.start_time?.slice(0, 5) ?? "",
    end_time: slot?.end_time?.slice(0, 5) ?? "",
    is_active: slot?.is_active ?? true,
  });
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  // "HH:MM" strings compare correctly as text
  const badWindow = form.start_time && form.end_time && form.start_time >= form.end_time;
  const invalid = form.name.trim().length < 2 || !form.start_time || !form.end_time || badWindow;
  const saving = create.isPending || update.isPending;

  const save = (event) => {
    event.preventDefault();
    const payload = { ...form, name: form.name.trim() };
    const options = {
      onSuccess: () => {
        notify.success(slot ? "Slot saved" : "Slot added");
        onClose();
      },
      onError: (error) => notify.apiError(error, "Could not save the slot"),
    };
    if (slot) update.mutate({ id: slot.id, payload }, options);
    else create.mutate(payload, options);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{slot ? "Edit slot" : "Add slot"}</DialogTitle>
            <DialogDescription>A same-day window stores pick when they assign a rider.</DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-medium text-foreground">
            Name
            <input className={INPUT} value={form.name} onChange={set("name")} maxLength={50} placeholder="Morning" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-foreground">
              Starts
              <input type="time" className={INPUT} value={form.start_time} onChange={set("start_time")} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Ends
              <input type="time" className={INPUT} value={form.end_time} onChange={set("end_time")} />
            </label>
          </div>
          {badWindow && <p className="text-xs text-destructive">The slot must end after it starts.</p>}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="h-4 w-4 accent-primary" />
            Active (shown on the assign screen)
          </label>
          <DialogFooter>
            <button type="button" className={GHOST} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={SOLID} disabled={invalid || saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DeliverySlots = () => {
  const { slots, isLoading, error, create, update } = useSlotAdmin();
  // undefined = closed, null = new slot, object = editing
  const [editing, setEditing] = useState(undefined);

  const toggle = (slot) =>
    update.mutate(
      { id: slot.id, payload: { is_active: !slot.is_active } },
      { onError: (err) => notify.apiError(err, "Could not change the slot") }
    );

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Delivery slots"
        description="Time windows stores choose from when assigning a rider. Switch a slot off instead of deleting it."
        action={
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add slot
          </button>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Window</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading slots...</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-destructive">Could not load the slots.</td>
              </tr>
            )}
            {!isLoading && !error && slots.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No slots yet. Stores can't assign riders until you add one.
                </td>
              </tr>
            )}
            {slots.map((slot) => (
              <tr key={slot.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{slot.name}</td>
                <td className="px-4 py-3 text-foreground">
                  {clock(slot.start_time)} - {clock(slot.end_time)}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={slot.is_active ? "Active" : "Off"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" className={GHOST} onClick={() => setEditing(slot)}>
                      Edit
                    </button>
                    <button type="button" className={GHOST} disabled={update.isPending} onClick={() => toggle(slot)}>
                      {slot.is_active ? "Switch off" : "Switch on"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <SlotDialog slot={editing} onClose={() => setEditing(undefined)} create={create} update={update} />
      )}
    </div>
  );
};

export default DeliverySlots;
