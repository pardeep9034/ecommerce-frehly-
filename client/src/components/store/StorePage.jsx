import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Shared button looks. Phone sizes first (52px touch targets), slimmer from lg up.
export const BTN = {
  primary:
    "flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-[#E2E6E4] disabled:text-muted-foreground lg:h-11 lg:rounded-xl lg:text-sm",
  secondary:
    "flex h-12 items-center justify-center gap-2 rounded-[14px] border border-border bg-card px-5 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted lg:h-11 lg:rounded-xl lg:text-sm",
  danger:
    "flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#B42318] px-5 text-base font-bold text-white transition-colors hover:bg-[#B42318]/90 disabled:opacity-60 lg:h-11 lg:rounded-xl lg:text-sm",
};

export const CARD = "rounded-2xl border border-border bg-card";

// One page shell for phone and web: a sticky header (back link, title, subtitle, badge)
// over the page body. The nav around it is StoreSidebar.
const StorePage = ({ title, subtitle, back, badge, children }) => (
  <>
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-card px-4 py-3 lg:px-8">
      {back && (
        <Link
          to={back}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors hover:bg-border"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="truncate text-lg font-bold text-foreground lg:text-xl lg:font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {badge}
    </header>
    <main className="flex flex-1 flex-col gap-3 p-4 lg:gap-5 lg:px-8 lg:py-6">{children}</main>
  </>
);

export default StorePage;
