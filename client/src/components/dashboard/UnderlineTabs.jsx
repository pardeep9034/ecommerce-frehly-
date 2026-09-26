// Tab row with a green underline on the active tab (warehouse detail, staff list).
// tabs: [{ value, label, icon? }]
const UnderlineTabs = ({ tabs, value, onChange, label }) => (
  <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none]">
    {tabs.map((tab) => {
      const active = tab.value === value;
      return (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(tab.value)}
          className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-[3px] px-4 text-sm transition-colors ${
            active
              ? "border-primary font-bold text-primary"
              : "border-transparent font-medium text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.icon && <tab.icon className="h-4 w-4" aria-hidden="true" />}
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default UnderlineTabs;
