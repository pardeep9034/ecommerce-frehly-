import { ArrowLeft, ArrowLeftRight, History, Home, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const NAV = [
  { to: "/partner/home", label: "Home", icon: Home },
  { to: "/partner/history", label: "History", icon: History },
  { to: "/partner/handover", label: "Handover", icon: ArrowLeftRight },
  { to: "/partner/profile", label: "Profile", icon: UserRound },
];

// Phone-sized frame (centred on desktop) for the partner PWA screens.
// `header` replaces the default title bar; `nav` adds the bottom tab bar.
const MobileShell = ({ title, subtitle, back, right, header, nav = false, children }) => (
  <div className="min-h-dvh bg-muted">
    <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col bg-background shadow-card">
      {header || (
        <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3">
          {back && (
            <Link
              to={back}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold leading-tight text-foreground">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <main className="flex-1 space-y-4 p-4">{children}</main>
      {nav && (
        <nav aria-label="Main" className="sticky bottom-0 grid grid-cols-4 border-t border-border bg-white">
          {NAV.map(({ to, label, icon }) => {
            const Icon = icon;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  </div>
);

export default MobileShell;
