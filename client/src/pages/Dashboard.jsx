import { Package, ShoppingCart, DollarSign, AlertTriangle, Users } from "lucide-react";
import StatCard from "@/components/freshly/StatCard";
import SalesChart from "@/components/freshly/SalesChart";
import RecentOrders from "@/components/freshly/RecentOrders";
import LowStockAlert from "@/components/freshly/LowStockAlert";

// Helper function to calculate percentage change
const calculateChange = (current, previous) => {
  if (previous === 0) return "+100%";
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
};

const mockStats = [
  { title: "Daily Revenue", value: "₹4,520", change: "+15.3% from yesterday", changeType: "positive", icon: DollarSign },
  { title: "Active Orders", value: "124", change: "+12 from yesterday", changeType: "positive", icon: ShoppingCart },
  { title: "New Customers", value: "32", change: "-2 from yesterday", changeType: "negative", icon: Users },
  { title: "Low Stock Items", value: "18", change: "+4 from yesterday", changeType: "negative", icon: AlertTriangle },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 lg:space-y-7  ">
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {mockStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <LowStockAlert />
      </div>

      <RecentOrders />
    </div>
  );
};

export default Dashboard;
