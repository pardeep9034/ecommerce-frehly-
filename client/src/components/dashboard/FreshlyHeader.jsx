import { Bell, Search, Menu } from "lucide-react";

const FreshlyHeader = ({ title, onMenuClick, user }) => {
  console.log('admin',user)
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || "Admin";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 shadow-soft sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden w-72 items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5 md:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="max-w-32 truncate text-sm font-semibold text-foreground">{fullName}</p>
            <p className="text-xs text-muted-foreground">Store Admin</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default FreshlyHeader;
