const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-6 px-5 py-4 sm:px-6">
          {Array.from({ length: columns }).map((__, col) => (
            <div
              key={col}
              className="h-3.5 flex-1 rounded skeleton-shimmer"
              style={{ animationDelay: `${(row * columns + col) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default TableSkeleton;
