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
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
      <p className="text-sm text-muted-foreground">
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
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
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