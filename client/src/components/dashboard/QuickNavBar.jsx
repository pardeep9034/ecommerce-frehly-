import { Link } from "react-router-dom";

const QuickNavBar = ({ links }) => {
  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-white p-2 shadow-card">
      {links.map(({ label, icon: Icon, path }) => (
        <Link
          key={path}
          to={path}
          className="group flex shrink-0 items-center gap-3 rounded-lg bg-muted px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Icon className="h-5 w-5" />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default QuickNavBar;
