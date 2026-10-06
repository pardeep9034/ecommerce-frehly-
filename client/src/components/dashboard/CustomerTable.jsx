import { Eye, Users } from "lucide-react";

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const CustomerTable = ({ customers = [], isLoading, onView, selectedId }) => {
  if (!customers.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">{isLoading ? "Loading customers..." : "No customers found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left">
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Customer</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Orders</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Spent</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Last order</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Joined</th>
              <th className="px-5 py-3.5 font-medium text-muted-foreground sm:px-6">Status</th>
              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${
                  selectedId === customer.id ? "bg-secondary" : ""
                }`}
              >
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent-foreground">
                      {initials(customer.name)}
                    </span>
                    <div>
                      <span className="block font-medium text-foreground">{customer.name}</span>
                      <span className="block text-xs text-muted-foreground">{customer.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-foreground sm:px-6">{customer.orders ?? "—"}</td>
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {customer.spent != null ? `₹${customer.spent.toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                </td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {new Date(customer.joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      customer.status === "Active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onView(customer)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerTable;
