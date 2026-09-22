import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PageHeader = ({ title, description, backTo, backLabel = "Back", action }) => {
  return (
    <div className="space-y-3">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
