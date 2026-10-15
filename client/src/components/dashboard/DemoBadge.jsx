import { FlaskConical } from "lucide-react";

// Marks numbers or lists that come from src/lib/demoData.js, not the backend.
const DemoBadge = ({ title = "Sample numbers from the design. The backend doesn't provide these yet." }) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground"
  >
    <FlaskConical className="h-3 w-3" aria-hidden="true" />
    Demo data
  </span>
);

export default DemoBadge;
