import { Fragment } from "react";

// Building blocks shared by the Activity log tabs: a selectable table with a detail card beside it, filter chips, small badges.

const TONE = {
  success: "bg-success/10 text-success",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-800",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
};

export const Pill = ({ tone = "muted", children }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{children}</span>
);

// A callout above a tab. `tone` is warning or info.
export const Note = ({ tone = "info", children }) => (
  <div role="note" className={`rounded-xl border px-4 py-3 text-sm ${tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-info/20 bg-info/5 text-info"}`}>
    {children}
  </div>
);

// Event / stage chips and the search box. `groups` is [[value, label], ...]; "" is "all".
export const LogFilters = ({ groups, group, onGroup, term, onTerm, placeholder }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div role="group" aria-label="Filter" className="flex flex-wrap gap-2">
      {groups.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={group === value}
          onClick={() => onGroup(value)}
          className={`min-h-9 rounded-full border px-4 text-sm font-medium transition-colors ${
            group === value ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
    <input
      type="search"
      aria-label={placeholder}
      placeholder={placeholder}
      value={term}
      onChange={(e) => onTerm(e.target.value)}
      className="h-9 w-56 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none"
    />
  </div>
);

const Message = ({ children }) => <p className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</p>;

// Header row plus one button per item. `grid` is a full Tailwind class like "grid-cols-[88px_1fr]" (it must appear whole in the source).
export const LogTable = ({ headers, grid, items, selectedId, onSelect, renderRow, isLoading, isError, empty }) => (
  <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-white shadow-card">
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className={`grid ${grid} gap-3 border-b border-border bg-muted px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`}>
          {headers.map((h) => <span key={h}>{h}</span>)}
        </div>
        {isLoading ? (
          <Message>Loading…</Message>
        ) : isError ? (
          <Message>Could not load this log. Try again in a moment.</Message>
        ) : items.length === 0 ? (
          <Message>{empty}</Message>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="border-b border-border/60 last:border-0">
                <button
                  type="button"
                  aria-pressed={item.id === selectedId}
                  onClick={() => onSelect(item.id)}
                  className={`grid ${grid} min-h-14 w-full items-center gap-3 px-5 py-2.5 text-left text-sm ${item.id === selectedId ? "bg-secondary" : "hover:bg-muted/60"}`}
                >
                  {renderRow(item)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </section>
);

// The card beside the table for the selected row.
export const DetailCard = ({ title, badge, code, children }) => (
  <aside aria-label="Details" className="w-full shrink-0 space-y-4 rounded-xl border border-border bg-white p-5 shadow-card lg:w-80">
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        {badge}
      </div>
      {code && <p className="mt-1 font-mono text-xs text-muted-foreground">{code}</p>}
    </div>
    {children}
  </aside>
);

// Label / value rows. A value of null shows "Not recorded".
export const Fields = ({ rows }) => (
  <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-3 text-[13px]">
    {rows.map(([label, value]) => (
      <Fragment key={label}>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className={`break-words ${value ? "text-foreground" : "italic text-muted-foreground"}`}>{value || "Not recorded"}</dd>
      </Fragment>
    ))}
  </dl>
);

export const CodeBlock = ({ title, children }) => (
  <div>
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 font-mono text-xs text-foreground">{children}</pre>
  </div>
);
