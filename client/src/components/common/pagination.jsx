const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <p className="text-sm text-[#6b7280]">
        Page {currentPage} of {totalPages} ({totalItems} total)
      </p>

      <div className="flex items-center gap-1.5">
        {Array.from(
          { length: totalPages },
          (_, index) => index + 1
        ).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-[#0f5132] text-white"
                : "text-[#6b7280] hover:bg-[#f3f4f6]"
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Pagination;