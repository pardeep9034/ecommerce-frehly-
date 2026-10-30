import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useRequestReturn } from "@/hooks/use-order";
import { CUSTOMER_RETURN_REASONS } from "@/lib/assignmentStatus";

// The server refuses these without a photo.
const PHOTO_REASONS = ["DAMAGED", "BAD_QUALITY", "WRONG_ITEM"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const RETURN_TERMS =
  "Report a problem within 24 hours of delivery. Damaged, bad-quality and wrong items need a clear photo. " +
  "The store reviews every request; approved items are refunded to how you paid (cash orders are refunded by the store).";

// Plain base64, no "data:...;base64," prefix: that's what the API takes.
const readBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Mounted only while open. `items`: the order's items with `remaining` (how much can still be returned);
// `itemId` preselects one.
const ReturnForm = ({ orderId, items, itemId, onClose }) => {
  const [form, setForm] = useState({ itemId: String(itemId ?? items[0]?.id ?? ""), quantity: 1, reason: "DAMAGED", note: "" });
  const [photo, setPhoto] = useState(null);
  const requestReturn = useRequestReturn(orderId);

  const item = items.find((i) => String(i.id) === form.itemId);
  const needsPhoto = PHOTO_REASONS.includes(form.reason);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const pick = (key) => (value) => setForm((f) => ({ ...f, [key]: value })); // Select hands back the value, not an event

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_PHOTO_BYTES) {
      toast.error("That photo is over 5 MB. Try a smaller one.");
      e.target.value = "";
      return;
    }
    setPhoto(file ?? null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      order_item_id: Number(form.itemId),
      quantity: Number(form.quantity),
      reason: form.reason,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
      ...(photo ? { photo: await readBase64(photo) } : {}),
    };
    requestReturn.mutate(body, {
      onSuccess: () => {
        toast.success("Request sent. The store will review it soon.");
        onClose();
      },
      onError: (err) => toast.error(err.response?.data?.message ?? "Couldn't send the request, please try again"),
    });
  };

  const field = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>Tell us what went wrong. The store will review it and refund approved items.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="return-item" className="block text-sm font-medium text-gray-700">Item</label>
            <Select value={form.itemId} onValueChange={pick("itemId")}>
              <SelectTrigger id="return-item" className="mt-1">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.product_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Quantity {item ? `(up to ${item.remaining})` : ""}
            <input type="number" min={1} max={item?.remaining ?? 1} step={1} value={form.quantity} onChange={set("quantity")} className={field} required />
          </label>
          <div>
            <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700">What's wrong?</label>
            <Select value={form.reason} onValueChange={pick("reason")}>
              <SelectTrigger id="return-reason" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_RETURN_REASONS.map((r) => (
                  <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Note {form.reason === "OTHER" ? "" : "(optional)"}
            <textarea value={form.note} onChange={set("note")} rows={2} maxLength={500} minLength={form.reason === "OTHER" ? 3 : undefined}
              required={form.reason === "OTHER"} className={field} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Photo {needsPhoto ? "" : "(optional)"}
            <input type="file" accept="image/jpeg,image/png" onChange={pickPhoto} required={needsPhoto} className="mt-1 block w-full text-sm" />
          </label>
          <p className="text-xs text-gray-500">{RETURN_TERMS}</p>
          <button type="submit" disabled={requestReturn.isPending || !item}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
            {requestReturn.isPending ? "Sending..." : "Send request"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnForm;
