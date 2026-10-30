import { useEffect, useState } from "react";
import { Camera, Minus, Plus } from "lucide-react";
import StoreApi from "../../apis/storeApi";

// A photo behind the staff token (so no plain <img src>), loaded on tap. `load` resolves to an object URL.
const PhotoOnTap = ({ load, alt, label }) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(null);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  if (url) return <img src={url} alt={alt} className="max-h-72 w-full rounded-xl border border-border object-contain" />;
  if (failed === 404) return <span className="text-[13px] text-muted-foreground">No photo</span>;
  return (
    <button type="button" onClick={() => load().then(setUrl, (err) => setFailed(err.response?.status ?? 0))} className="inline-flex items-center gap-1.5 self-start text-[13px] font-bold text-primary">
      <Camera className="h-4 w-4" /> {failed !== null ? "Couldn't load the photo · try again" : label}
    </button>
  );
};

// The rider's photo of what the customer turned away.
export const DoorPhoto = ({ assignmentId }) => (
  <PhotoOnTap load={() => StoreApi.getDoorPhotoUrl(assignmentId)} alt="Items turned away at the door" label="See the rider's photo" />
);

// The customer's photo with their return request.
export const ReturnPhoto = ({ orderId, returnId }) => (
  <PhotoOnTap load={() => StoreApi.getReturnPhotoUrl(orderId, returnId)} alt="The customer's photo of the problem" label="See the customer's photo" />
);

// How many of `total` go back on the shelf; the rest are written off.
export const SplitStepper = ({ label, total, restock, onChange }) => (
  <div className="flex items-center gap-3">
    <span className="min-w-0 flex-1 text-[13px] text-muted-foreground">
      {restock} back on shelf · {total - restock} written off
    </span>
    <button
      type="button"
      aria-label={`One fewer ${label} back on shelf`}
      disabled={restock === 0}
      onClick={() => onChange(restock - 1)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border disabled:opacity-40"
    >
      <Minus className="h-4 w-4" />
    </button>
    <button
      type="button"
      aria-label={`One more ${label} back on shelf`}
      disabled={restock >= total}
      onClick={() => onChange(restock + 1)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border disabled:opacity-40"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);
