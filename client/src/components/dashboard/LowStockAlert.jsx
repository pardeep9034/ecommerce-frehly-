import { AlertTriangle } from "lucide-react";

const lowStockItems = [
  { name: "Organic Bananas", stock: 5, emoji: "🍌" },
  { name: "Whole Milk", stock: 8, emoji: "🥛" },
  { name: "Fresh Salmon", stock: 3, emoji: "🐟" },
  { name: "Sourdough Bread", stock: 12, emoji: "🍞" },
  { name: "Greek Yogurt", stock: 7, emoji: "🥣" },
];

const LowStockAlert = () => {
  return (
    <div className="rounded-xl border border-border bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="font-display font-semibold text-foreground">Low Stock Alerts</h3>
      </div>
      <ul className="divide-y divide-border">
        {lowStockItems.map((item) => (
          <li key={item.name} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted sm:px-6">
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-warning">{item.stock} left</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LowStockAlert;
