import { Info } from "lucide-react";

// One muted line explaining why a control can't be changed.
const ReadOnlyNote = ({ children }) => (
  <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
    <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
    {children}
  </p>
);

export default ReadOnlyNote;
