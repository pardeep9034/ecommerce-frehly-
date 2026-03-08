import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", sales: 2400 },
  { day: "Tue", sales: 1398 },
  { day: "Wed", sales: 3200 },
  { day: "Thu", sales: 2780 },
  { day: "Fri", sales: 4100 },
  { day: "Sat", sales: 5200 },
  { day: "Sun", sales: 3800 },
];

const SalesChart = () => {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-card sm:p-6">
      <h3 className="mb-5 font-display font-semibold text-[#1f2937]">Weekly Sales</h3>
      <div className="h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f5132" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0f5132" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#0f5132"
              strokeWidth={2}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
