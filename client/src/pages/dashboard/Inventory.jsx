import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InventoryTable from "@/components/dashboard/InventoryTable";
import InventoryModal from "@/components/dashboard/InventoryModal";
import QuickNavBar from "@/components/dashboard/QuickNavBar";
import PageHeader from "@/components/dashboard/PageHeader";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import SearchableSelector from "@/components/common/SearchableSelector";
import WarehouseApi from "@/apis/warehouseApi";
import useInventory from "@/hooks/use-inventory";
import { toast } from "@/components/ui/sonner";
import { Plus, Search, Warehouse, ArrowLeftRight, Lock, AlertCircle } from "lucide-react";


const Inventory = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [warehouseId, setWarehouseId] = useState("");

    const pageSize = 10;

    const quickLinks = [
        { label: "Warehouse", icon: Warehouse, path: "/dashboard/warehouses" },
        { label: "Stock Movement", icon: ArrowLeftRight, path: "/dashboard/inventory/stock-movement" },
        { label: "Stock Reservation", icon: Lock, path: "/dashboard/inventory/stock-reservation" },
    ];

    const {
        inventory: inventoryData,
        isLoading,
        error,
        createInventory,
        updateInventory,
        deleteInventory,
    } = useInventory(currentPage, pageSize, warehouseId);

    const { data: warehousesResponse, isLoading: isWarehousesLoading } = useQuery({
        queryKey: ["warehouses"],
        queryFn: WarehouseApi.getAllWarehouses,
    });

    const warehouseData = warehousesResponse?.data ?? warehousesResponse;
    const warehouses = Array.isArray(warehouseData)
        ? warehouseData
        : warehouseData?.warehouses ?? warehouseData?.rows ?? [];

    const inventoryPayload = inventoryData?.data ?? inventoryData;
    const inventoryList = Array.isArray(inventoryPayload)
        ? inventoryPayload
        : inventoryPayload?.inventory ?? inventoryPayload?.variants ?? inventoryPayload?.rows ?? [];
    const pagination = inventoryData?.data?.pagination || {};

    const filteredInventory = useMemo(() => {
        return inventoryList.filter((item) => {
            const searchMatch =
                item.variant_id.toString().includes(searchTerm.toLowerCase()) ||
                (item.variant && (
                    item.variant.measurementUnit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.variant.unit?.toLowerCase().includes(searchTerm.toLowerCase())
                ));
            return searchMatch;
        });
    }, [inventoryList, searchTerm]);

    const totalPages = pagination.totalPages || 1;

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const saveInventory = (payload) => {
        const action = editingItem ? "update" : "create";
        const onError = (requestError) => {
            toast.error(`Unable to ${action} inventory`, {
                description: requestError?.response?.data?.message || "Please review the inventory details and try again.",
            });
        };
        const onSuccess = () => {
            toast.success(`Inventory ${action}d successfully`);
            setIsModalOpen(false);
            setEditingItem(null);
        };

        if (editingItem) {
            updateInventory.mutate({ id: editingItem.id, data: payload }, { onSuccess, onError });
        } else {
            createInventory.mutate(payload, { onSuccess, onError });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this inventory record?")) {
            deleteInventory.mutate(id);
        }
    };

    const setPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    if (error) {
        return <div className="flex items-center justify-center p-10 text-destructive">Failed to load inventory.</div>;
    }

    return (
        <div className="space-y-6 lg:space-y-7">
            <PageHeader
                title="Inventory"
                description="Track stock levels across your warehouses."
                action={
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Inventory
                    </button>
                }
            />
              <QuickNavBar links={quickLinks} />
        {/*
        <button
        onClick={()=>navigate("/dashboard/products/category")}
          className="flex h-20 min-w-24 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <List className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">Category</span>
        </button>
      
        <button
        onClick={()=>navigate("/dashboard/products/product-type")}
          className="flex h-20 min-w-28 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <List className="h-5 w-5 text-gray-500" />
          <span className="text-center text-sm font-medium">Product Type</span>
        </button>
      
        <button
        onClick={()=>navigate("/dashboard/products/product-attribute")}
          className="flex h-20 min-w-32 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <List className="h-5 w-5 text-gray-500" />
          <span className="text-center text-sm font-medium">
            Product Attribute
          </span>
        </button> */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by Variant ID or detail..."
                                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <div className="w-full min-w-60 sm:max-w-sm">
                            <SearchableSelector
                                data={warehouses}
                                labelKey="name"
                                valueKey="id"
                                onSelect={(id) => {
                                    setWarehouseId(id);
                                    setCurrentPage(1);
                                }}
                                placeholder={isWarehousesLoading ? "Loading warehouses..." : "select a warehouse"}
                                disabled={isWarehousesLoading}
                                className="w-full disabled:bg-gray-50 disabled:text-gray-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {!warehouseId && (
                <p className="rounded-xl border border-border bg-muted px-5 py-3 text-sm text-muted-foreground">
                    Select a warehouse to manage its variant inventory.
                </p>
            )}

            {/* {warehouseId && (
                <p className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-3 text-sm text-primary">
                    Warehouse selected. Variant inventory loading will be connected when the warehouse inventory API is available.
                </p>
            )} */}

            {warehouseId && (isLoading ? (
                <TableSkeleton rows={pageSize} columns={5} />
            ) : (
                <InventoryTable inventory={filteredInventory} onEdit={openEditModal} onDelete={handleDelete} highlightTerm={searchTerm} />
            ))}

            {warehouseId && !isLoading && totalPages > 1 && (
                <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({pagination.totalItems} total)
                    </p>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                type="button"
                                key={page}
                                onClick={() => setPage(page)}
                                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <InventoryModal
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                }}
                inventory={editingItem}
                onSave={saveInventory}
                warehouses={warehouses}
                selectedWarehouseId={warehouseId}
                isWarehousesLoading={isWarehousesLoading}
            />
        </div>
    );
};

export default Inventory;
