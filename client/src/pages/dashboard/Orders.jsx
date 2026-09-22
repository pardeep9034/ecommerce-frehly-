import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import OrderStatusBoard from "@/components/dashboard/OrderStatusBoard";
import PageHeader from "@/components/dashboard/PageHeader";

const BOARD_STATUSES = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "PAYMENT_EXPIRED",
  "PLACED",
  "CONFIRMED",
  "READY_FOR_ASSIGNMENT",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "HANDOVER_IN_PROGRESS",
  "DELIVERED",
  "CANCELLED",
  "DELIVERY_FAILED",
];

const Orders = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader title="Orders" description="Monitor and manage orders as they move through fulfillment." />

      <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by order ID or user ID..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <OrderStatusBoard statuses={BOARD_STATUSES} search={search} />
    </div>
  );
};

export default Orders;
