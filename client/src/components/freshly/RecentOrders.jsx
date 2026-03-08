const orders = [
  { id: "#ORD-2041", customer: "Sarah Johnson", items: 5, total: 67.5, status: "Delivered", time: "10 min ago" },
  { id: "#ORD-2040", customer: "Mike Chen", items: 3, total: 34.2, status: "Processing", time: "25 min ago" },
  { id: "#ORD-2039", customer: "Emily Davis", items: 8, total: 112, status: "Shipped", time: "1 hr ago" },
  { id: "#ORD-2038", customer: "Alex Rivera", items: 2, total: 21.99, status: "Delivered", time: "2 hrs ago" },
  { id: "#ORD-2037", customer: "Lisa Park", items: 6, total: 89.75, status: "Processing", time: "3 hrs ago" },
];

const statusStyles = {
  Delivered: "bg-[#0f5132]/10 text-[#0f5132]",
  Processing: "bg-[#b8860b]/15 text-[#8f6908]",
  Shipped: "bg-[#f3f4f6] text-[#6b7280]",
};

const RecentOrders = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-card">
      <div className="border-b border-[#e5e7eb] px-5 py-4 sm:px-6 sm:py-5">
        <h3 className="font-display font-semibold text-[#1f2937]">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8faf8]">
              <th className="px-5 py-3 text-left font-medium text-[#6b7280] sm:px-6">Order</th>
              <th className="px-5 py-3 text-left font-medium text-[#6b7280] sm:px-6">Customer</th>
              <th className="px-5 py-3 text-left font-medium text-[#6b7280] sm:px-6">Items</th>
              <th className="px-5 py-3 text-left font-medium text-[#6b7280] sm:px-6">Total</th>
              <th className="px-5 py-3 text-left font-medium text-[#6b7280] sm:px-6">Status</th>
              <th className="px-5 py-3 text-right font-medium text-[#6b7280] sm:px-6">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]">
                <td className="px-5 py-3.5 font-medium text-[#1f2937] sm:px-6">{order.id}</td>
                <td className="px-5 py-3.5 text-[#1f2937] sm:px-6">{order.customer}</td>
                <td className="px-5 py-3.5 text-[#6b7280] sm:px-6">{order.items}</td>
                <td className="px-5 py-3.5 font-medium text-[#1f2937] sm:px-6">${order.total.toFixed(2)}</td>
                <td className="px-5 py-3.5 sm:px-6">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-[#6b7280] sm:px-6">{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
