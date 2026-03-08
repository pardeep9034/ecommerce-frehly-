import { Bell, Search, Menu } from "lucide-react";

const FreshlyHeader = ({ title, onMenuClick }) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 shadow-soft sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[#1f2937] transition-colors hover:bg-[#f3f4f6] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-[#1f2937]">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden w-72 items-center gap-2 rounded-lg bg-[#f3f4f6] px-3.5 py-2.5 md:flex">
          <Search className="h-4 w-4 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
          />
        </div>

        <button className="relative rounded-lg p-2 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#b8860b]" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f5132] text-sm font-semibold text-white">
          JD
        </div>
      </div>
    </header>
  );
};

export default FreshlyHeader;
