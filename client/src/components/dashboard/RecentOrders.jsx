const orders = [
  { id: "#ORD-2041", customer: "Sarah Johnson", items: 5, total: 67.5, status: "Delivered", time: "10 min ago" },
  { id: "#ORD-2040", customer: "Mike Chen", items: 3, total: 34.2, status: "Processing", time: "25 min ago" },
  { id: "#ORD-2039", customer: "Emily Davis", items: 8, total: 112, status: "Shipped", time: "1 hr ago" },
  { id: "#ORD-2038", customer: "Alex Rivera", items: 2, total: 21.99, status: "Delivered", time: "2 hrs ago" },
  { id: "#ORD-2037", customer: "Lisa Park", items: 6, total: 89.75, status: "Processing", time: "3 hrs ago" },
];

const statusStyles = {
  Delivered: "bg-success/10 text-success",
  Processing: "bg-warning/15 text-warning-foreground",
  Shipped: "bg-muted text-muted-foreground",
};

const RecentOrders = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="border-b border-border px-5 py-4 sm:px-6 sm:py-5">
        <h3 className="font-display font-semibold text-foreground">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground sm:px-6">Order</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground sm:px-6">Customer</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground sm:px-6">Items</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground sm:px-6">Total</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground sm:px-6">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                <td className="px-5 py-3.5 font-medium text-foreground sm:px-6">{order.id}</td>
                <td className="px-5 py-3.5 text-foreground sm:px-6">{order.customer}</td>
                <td className="px-5 py-3.5 text-muted-foreground sm:px-6">{order.items}</td>
                <td className="px-5 py-3.5 font-medium text-foreground sm:px-6">${order.total.toFixed(2)}</td>
                <td className="px-5 py-3.5 sm:px-6">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-muted-foreground sm:px-6">{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
