import { useEffect, useRef, useState } from "react";

const SearchableSelector = ({
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
}) => {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  console.log("data in searchable selector", data);

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
      <input
        type="text"
        value={search}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleSearch}
        onFocus={() => setShowDropdown(true)}
        onBlur={handleBlur}
        className={
          className || "w-full rounded-lg border px-3 py-2"
        }
      />

      {showDropdown && (
        <div className="absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <button
                type="button"
                key={item[valueKey]}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="block w-full px-3 py-2 text-left hover:bg-gray-100"
              >
                {item[labelKey]}
              </button>
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