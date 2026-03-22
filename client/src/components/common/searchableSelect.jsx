import { useState } from "react";

const SearchableSelector = ({
  data = [],
  placeholder = "Search...",
  labelKey = "name",
  valueKey = "id",
  onSelect,
  onSearchChange,
  value,
  disabled,
  className
}) => {

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // If we have an initial value but no search text, we could potentially set it,
  // but it's okay to just leave it blank until the user types.

  const filteredData = data.filter((item) => {
      // If parent is doing the searching, it might pass exact matches.
      // We still do a soft filter just in case.
      if (!item[labelKey]) return false;
      return item[labelKey].toString().toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (item) => {
    setSearch(item[labelKey]);
    setShowDropdown(false);
    if (onSelect) onSelect(item[valueKey], item);
  };

  return (
    <div className="relative w-full">

      <input
        type="text"
        value={search || (disabled && value ? value : search)}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
          if (onSearchChange) onSearchChange(e.target.value);
        }}
        className={className || "w-full border rounded-lg px-3 py-2"}
      />

      {showDropdown && (
        <div className="absolute w-full bg-white border rounded-lg mt-1 max-h-60 overflow-auto shadow-lg z-50">

          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div
                key={item[valueKey]}
                onClick={() => handleSelect(item)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              >
                {item[labelKey]}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">
              No results found
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default SearchableSelector;