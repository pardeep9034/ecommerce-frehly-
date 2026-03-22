import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import SearchableSelector from "../common/searchableSelect";
import ProductApi from "../../apis/productApi";

const EMPTY_INVENTORY = {
    variantId: "",
    stock: 0,
    reservedStock: 0,
    lowStockAlert: 5,
};

const InventoryModal = ({ open, onClose, inventory, onSave }) => {
    const [form, setForm] = useState(EMPTY_INVENTORY);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const isEditMode = Boolean(inventory);

    useEffect(() => {
        if (inventory) {
            setForm({
                variantId: inventory.variantId || "",
                stock: inventory.stock || 0,
                reservedStock: inventory.reservedStock || 0,
                lowStockAlert: inventory.lowStockAlert || 5,
            });
            return;
        }

        setForm(EMPTY_INVENTORY);
    }, [inventory, open]);

    const handleSearch = useCallback(async (searchTerm) => {
        if (!searchTerm || searchTerm.trim().length === 0) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const result = await ProductApi.searchVariants(searchTerm);
            if (result?.success && Array.isArray(result.data)) {
                const options = [];
                result.data.forEach(product => {
                    if (Array.isArray(product.variants)) {
                        product.variants.forEach(variant => {
                            options.push({
                                id: variant.id,
                                label: `${product.name} - ${variant.value}${variant.unit}`
                            });
                        });
                    }
                });
                setSearchResults(options);
            }
        } catch (error) {
            console.error("Failed to search variants:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    if (!open) {
        return null;
    }

    const onChangeField = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "variantId" ? value : parseInt(value) || 0
        }));
    };

    const onSubmit = (event) => {
        event.preventDefault();
        onSave({
            ...form,
            variantId: parseInt(form.variantId),
            stock: parseInt(form.stock),
            reservedStock: parseInt(form.reservedStock),
            lowStockAlert: parseInt(form.lowStockAlert)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm" onClick={onClose}>
            <div
                className="mx-4 w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white shadow-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
                    <h2 className="font-display text-lg font-semibold text-[#1f2937]">
                        {isEditMode ? "Edit Inventory" : "Add Inventory"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-6">
                    <div>
                        <label className="text-sm font-medium text-[#1f2937]" htmlFor="variant-id">
                            Variant ID
                        </label>
                        {/* <input
                            id="variant-id"
                            name="variantId"
                            type="number"
                            value={form.variantId}
                            onChange={onChangeField}
                            required
                            disabled={isEditMode}
                            className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="Enter variant ID"
                        /> */}
                        <SearchableSelector
                            data={searchResults}
                            labelKey="label"
                            valueKey="id"
                            value={form.variantId}
                            onSelect={(id, item) => onChangeField({ target: { name: 'variantId', value: id } })}
                            onSearchChange={handleSearch}
                            required
                            disabled={isEditMode}
                            className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132] disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder={isSearching ? "Searching..." : "Search for a product..."}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="stock">
                                Current Stock
                            </label>
                            <input
                                id="stock"
                                name="stock"
                                type="number"
                                value={form.stock}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="reserved-stock">
                                Reserved Stock
                            </label>
                            <input
                                id="reserved-stock"
                                name="reservedStock"
                                type="number"
                                value={form.reservedStock}
                                onChange={onChangeField}
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-[#1f2937]" htmlFor="low-stock-alert">
                            Low Stock Alert Threshold
                        </label>
                        <input
                            id="low-stock-alert"
                            name="lowStockAlert"
                            type="number"
                            value={form.lowStockAlert}
                            onChange={onChangeField}
                            className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                            placeholder="5"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#1f2937] transition-colors hover:bg-[#f3f4f6]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
                        >
                            {isEditMode ? "Save Changes" : "Create Inventory"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryModal;
