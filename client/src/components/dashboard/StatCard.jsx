import { TrendingUp, TrendingDown } from "lucide-react";

const StatCard = ({ title, value, change, changeType, icon: Icon }) => {
  const isPositive = changeType === "positive";

  return (
    <div className="animate-fade-in rounded-xl border border-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                isPositive ? "text-primary" : "text-warning"
              }`}
            >
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
