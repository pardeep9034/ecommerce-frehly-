import { STAGE_STYLES, STAGES } from "../../lib/orderStage";

const LABELS = Object.fromEntries(STAGES.map((s) => [s.key, s.label]));

const StageBadge = ({ stage }) => {
  if (!stage) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        STAGE_STYLES[stage] || "bg-muted text-muted-foreground"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[stage] || stage}
    </span>
  );
};

export default StageBadge;
