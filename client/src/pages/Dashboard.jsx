import { Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import StatCard from "@/components/freshly/StatCard";
import SalesChart from "@/components/freshly/SalesChart";
import RecentOrders from "@/components/freshly/RecentOrders";
import LowStockAlert from "@/components/freshly/LowStockAlert";

const stats = [
  { title: "Total Products", value: "1,284", change: "+12% from last month", changeType: "positive", icon: Package },
  { title: "Total Orders", value: "856", change: "+8.2% from last week", changeType: "positive", icon: ShoppingCart },
  { title: "Daily Revenue", value: "$4,520", change: "+15.3% from yesterday", changeType: "positive", icon: DollarSign },
  { title: "Low Stock Items", value: "23", change: "5 critical", changeType: "negative", icon: AlertTriangle },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 lg:space-y-7  ">
      <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {stats.map((stat) => (
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
