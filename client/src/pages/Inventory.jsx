import { useMemo, useState } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import InventoryTable from "@/components/freshly/InventoryTable";
import InventoryModal from "@/components/freshly/InventoryModal";
import useInventory from "@/hooks/use-inventory";

const Inventory = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const pageSize = 10;

    const {
        inventory: inventoryData,
        isLoading,
        error,
        createInventory,
        updateInventory,
        deleteInventory,
    } = useInventory(currentPage, pageSize);

    const inventoryList = inventoryData?.data?.inventory || [];
    const pagination = inventoryData?.data?.pagination || {};

    const filteredInventory = useMemo(() => {
        return inventoryList.filter((item) => {
            const searchMatch =
                item.variantId.toString().includes(searchTerm.toLowerCase()) ||
                (item.variant && (
                    item.variant.unitType.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        if (editingItem) {
            updateInventory.mutate({ id: editingItem.id, data: payload });
        } else {
            createInventory.mutate(payload);
        }
        setIsModalOpen(false);
        setEditingItem(null);
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10 text-[#6b7280]">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading inventory...
            </div>
        );
    }

    if (error) {
        return <div className="flex items-center justify-center p-10 text-red-500">Failed to load inventory.</div>;
    }

    return (
        <div className="space-y-6 lg:space-y-7">
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-card sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5">
                            <Search className="h-4 w-4 text-[#6b7280]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by Variant ID or detail..."
                                className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
                    >
                        <Plus className="h-4 w-4" />
                        Add Inventory
                    </button>
                </div>
            </div>

            <InventoryTable inventory={filteredInventory} onEdit={openEditModal} onDelete={handleDelete} />

            {totalPages > 1 && (
                <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                    <p className="text-sm text-[#6b7280]">
                        Page {currentPage} of {totalPages} ({pagination.totalItems} total)
                    </p>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                type="button"
                                key={page}
                                onClick={() => setPage(page)}
                                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage ? "bg-[#0f5132] text-white" : "text-[#6b7280] hover:bg-[#f3f4f6]"
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
            />
        </div>
    );
};

export default Inventory;
