import { Search, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import PageHeader from "@/components/dashboard/PageHeader";
import CustomerTable from "@/components/dashboard/CustomerTable";
import CustomerDetailPanel from "@/components/dashboard/CustomerDetailPanel";
import Pagination from "@/components/common/Pagination";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import useCustomers, { useSetCustomerStatus } from "@/hooks/use-customer";

const PAGE_SIZE = 10;
const FILTERS = {
  All: {},
  "New this week": { joined_days: 7 },
  Blocked: { status: "blocked" },
};

const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToBlock, setCustomerToBlock] = useState(null);
  const statusMutation = useSetCustomerStatus();

  // ?customer=<id> (from an order's "View customer") shows just that customer and opens their panel.
  const [searchParams, setSearchParams] = useSearchParams();
  const customerIdParam = searchParams.get("customer");
  const autoOpened = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const { customers, pagination, counts, summary, isLoading } = useCustomers(currentPage, PAGE_SIZE, {
    search,
    id: customerIdParam || undefined,
    ...FILTERS[filter],
  });

  useEffect(() => {
    if (customerIdParam && customers.length === 1 && !autoOpened.current) {
      autoOpened.current = true;
      setSelectedCustomer(customers[0]);
    }
  }, [customerIdParam, customers]);

  const showAllCustomers = () => {
    autoOpened.current = false;
    setSearchParams({}, { replace: true });
  };

  const changeStatus = (customer, isActive) => {
    statusMutation.mutate(
      { id: customer.id, isActive },
      {
        onSuccess: () => {
          toast.success(isActive ? "Customer unblocked" : "Customer blocked");
          // The open panel keeps its snapshot if a filter drops this customer from the list, so update it too.
          setSelectedCustomer((current) =>
            current?.id === customer.id ? { ...current, status: isActive ? "Active" : "Blocked" } : current
          );
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Unable to update the customer"),
      }
    );
  };

  // Unblocking is harmless, so it goes straight through; blocking asks first (it signs the customer out).
  const handleToggleBlock = (customer) => {
    if (customer.status === "Blocked") changeStatus(customer, true);
    else setCustomerToBlock(customer);
  };

  const cards = [
    { label: "Customers", value: counts?.total ?? "—", hint: counts ? `+${counts.newThisWeek} this week` : "" },
    {
      label: "Ordered this month",
      value: summary?.ordered_this_month ?? "—",
      hint: counts && summary ? `${percent(summary.ordered_this_month, counts.total)} of all customers` : "",
    },
    {
      label: "Repeat rate",
      value: summary ? percent(summary.repeat_customers, summary.customers_with_orders) : "—",
      hint: "Of customers who have ordered",
    },
    { label: "Blocked", value: counts?.blocked ?? "—", hint: "Can't sign in" },
  ];

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Customers"
        description="Shopper profiles, order history and account status."
        action={
          <button
            type="button"
            onClick={() => toast("Export isn't wired up yet")}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">{card.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          {customerIdParam && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-card">
              <span className="text-muted-foreground">Showing customer #{customerIdParam} only</span>
              <button type="button" onClick={showAllCustomers} className="font-medium text-primary hover:underline">
                Show all customers
              </button>
            </div>
          )}
          <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, phone or email..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(FILTERS).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
                      filter === option ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <CustomerTable
            customers={customers}
            isLoading={isLoading}
            onView={setSelectedCustomer}
            selectedId={selectedCustomer?.id}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 0}
            totalItems={pagination?.totalItems ?? 0}
            onPageChange={setCurrentPage}
          />
        </div>

        {selectedCustomer && (
          <CustomerDetailPanel
            customer={customers.find((customer) => customer.id === selectedCustomer.id) ?? selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onToggleBlock={handleToggleBlock}
            isUpdating={statusMutation.isPending}
          />
        )}
      </div>

      <ConfirmationModal
        open={Boolean(customerToBlock)}
        title={`Block ${customerToBlock?.name ?? "this customer"}?`}
        cancelBtnName="Cancel"
        proceedBtnName="Block"
        onClose={() => setCustomerToBlock(null)}
        onSuccess={() => {
          changeStatus(customerToBlock, false);
          setCustomerToBlock(null);
        }}
      />
    </div>
  );
};

export default Customers;
