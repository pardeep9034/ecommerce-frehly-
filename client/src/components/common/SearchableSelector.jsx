import { forwardRef, useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SearchableSelector = forwardRef(({
  id,
  data = [],
  placeholder = "Search...",
  labelKey = "name",
  valueKey = "id",
  onSelect,
  onSearchChange,
  value,
  disabled,
  className,
  serverSearch = false,
}, ref) => {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedItem = data.find(
    (item) => item[valueKey] === value
  );

  useEffect(() => {
    if (selectedItem && !showDropdown) {
      setSearch(selectedItem[labelKey]);
    }
  }, [value, data]);

  const filteredData = serverSearch
    ? data
    : data.filter((item) =>
        item[labelKey]
          ?.toString()
          .toLowerCase()
          .includes(search.toLowerCase())
      );

  const handleSearch = (e) => {
    const query = e.target.value;

    setSearch(query);
    setShowDropdown(true);

    onSearchChange?.(query);
  };

  const handleSelect = (item) => {
    setSearch(item[labelKey]);
    setShowDropdown(false);

    onSelect?.(item[valueKey], item);
  };

  const handleBlur = () => {
    // Give the dropdown item's click time to execute
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  return (
    <div className="relative w-full">
      <div className="relative ">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground " />
        <input
          ref={ref}
          id={id}
          type="text"
          value={search}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleSearch}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          className={cn(
            "w-full rounded-lg border border-border bg-white py-2 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
            showDropdown && "rotate-180"
          )}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-[9999] mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-border bg-white p-1 shadow-card">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <button
                type="button"
                key={item[valueKey]}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted",
                  item[valueKey] === value && "bg-primary/5 font-medium text-primary"
                )}
              >
                {item[labelKey]}
              </button>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {search ? `No results for "${search}"` : "No options available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchableSelector.displayName = "SearchableSelector";

export default SearchableSelector;
