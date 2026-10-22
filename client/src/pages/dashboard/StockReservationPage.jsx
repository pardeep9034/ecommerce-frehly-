import { Search, Plus, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import ReservationTable from "@/components/dashboard/ReservationTable";
import Pagination from "@/components/common/Pagination";
import useStockResvation from "@/hooks/use-stockReservation";
import ReservationModal from "@/components/dashboard/ReservationModal";
import PageHeader from "@/components/dashboard/PageHeader";
import WarehouseApi from "@/apis/warehouseApi";
import VariantApi from "@/apis/variantApi";

const EMPTY = [];

const STATUS_FILTERS = ["All", "ACTIVE", "CONFIRMED", "RELEASED", "EXPIRED"];
const STATUS_LABELS = { All: "All", ACTIVE: "Active", CONFIRMED: "Confirmed", RELEASED: "Released", EXPIRED: "Expired" };

const StockReservationPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState(""); // searchTerm after a short pause in typing
  const [statusFilter, setStatusFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, warehouseFilter]);

  const { data, statsData, createMutation, isLoading, releaseMutation, confirmMutation } = useStockResvation({
    page: currentPage,
    limit: 10,
    status: statusFilter === "All" ? undefined : statusFilter,
    warehouseId: warehouseFilter || undefined,
    search: search || undefined,
  });
  const queryClient = useQueryClient();

  const reservations = data?.data?.stockReservations ?? EMPTY;
  const pagination = data?.data?.pagination ?? [];
  const statsReservations = statsData?.data?.stockReservations ?? EMPTY;

  const { data: warehousesResponse } = useQuery({
    queryKey: ["warehouses"],
    queryFn: WarehouseApi.getAllWarehouses,
  });
  const warehouses = warehousesResponse?.data?.warehouses ?? warehousesResponse?.data ?? EMPTY;
  const warehouseNames = useMemo(() => Object.fromEntries(warehouses.map((w) => [w.id, w.name])), [warehouses]);

  const variantIds = useMemo(() => [...new Set(reservations.map((r) => r.variant_id))], [reservations]);
  const { data: variantInfoResponse } = useQuery({
    queryKey: ["variantInfo", variantIds],
    queryFn: () => VariantApi.variantsInfo(variantIds),
    enabled: variantIds.length > 0,
  });
  const variantNames = useMemo(() => {
    const list = variantInfoResponse?.data ?? [];
    return Object.fromEntries(list.map((v) => [v.id, [v.product_name, v.variant_name].filter(Boolean).join(" · ")]));
  }, [variantInfoResponse]);

  // Per status, within the chosen warehouse/search; a status with no rows is absent, so read with ?? 0.
  const statusCounts = data?.data?.statusCounts ?? {};

  const openAddModal = () => setIsModalOpen(true);

  const saveReservtion = (payload) => {
    createMutation.mutate(payload);
    setIsModalOpen(false);
  };

  const invalidateReservations = () => queryClient.invalidateQueries({ queryKey: ["stockReservation"] });

  const handleConfirm = (reservation) => {
    confirmMutation.mutate(reservation.id, {
      onError: () => toast.error("Unable to confirm reservation"),
      onSettled: invalidateReservations,
    });
  };

  const handleRelease = (reservation) => {
    releaseMutation.mutate(reservation.id, {
      onError: () => toast.error("Unable to release reservation"),
      onSettled: invalidateReservations,
    });
  };

  const handleReleaseExpiredNow = () => {
    const now = Date.now();
    const expired = statsReservations.filter(
      (r) => String(r.status).toUpperCase() === "ACTIVE" && r.expires_at && new Date(r.expires_at).getTime() < now
    );
    if (!expired.length) {
      toast("No active reservations are past their expiry");
      return;
    }
    expired.forEach((r) => releaseMutation.mutate(r.id));
    toast.success(`Releasing ${expired.length} expired reservation${expired.length > 1 ? "s" : ""}`);
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Stock Reservations"
        description="Track stock held against pending or confirmed orders."
        backTo="/admin/inventory"
        backLabel="Back to Inventory"
        action={
          <button
            onClick={openAddModal}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create reservation
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          { label: "Active", value: statusCounts.ACTIVE ?? 0 },
          { label: "Confirmed", value: statusCounts.CONFIRMED ?? 0 },
          { label: "Released", value: statusCounts.RELEASED ?? 0 },
          { label: "Expired", value: statusCounts.EXPIRED ?? 0, warn: true },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-white p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${card.warn ? "text-destructive" : "text-foreground"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                  statusFilter === status ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted"
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <select
            value={warehouseFilter}
            onChange={(event) => setWarehouseFilter(event.target.value)}
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none"
          >
            <option value="">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleReleaseExpiredNow}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <TimerReset className="h-3.5 w-3.5" />
            Release expired now
          </button>

          <div className="ml-auto flex w-full items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by order or product name..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <ReservationTable
        reservations={reservations}
        variantNames={variantNames}
        warehouseNames={warehouseNames}
        onConfirm={handleConfirm}
        onRelease={handleRelease}
        isLoading={isLoading}
      />

      <ReservationModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={saveReservtion} />

      <Pagination
        currentPage={currentPage}
        totalPages={pagination?.totalPages ?? 0}
        totalItems={pagination?.totalItems ?? 0}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StockReservationPage;
