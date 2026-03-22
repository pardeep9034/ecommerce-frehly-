import { Edit2, Trash2, Package } from "lucide-react";

const formatVariant = (variant) => {
    if (!variant) return "Unknown Variant";
    
    const productName = variant.Product?.name || variant.product?.name || "";
    const prefix = productName ? `${productName} - ` : "";

    const { unitType, value, unit } = variant;
    if (unitType === "piece") return `${prefix}${value} pc`;
    if (unitType === "pack") return `${prefix}Pack of ${value}`;
    return `${prefix}${value} ${unit}`;
};

const InventoryTable = ({ inventory, onEdit, onDelete }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#e5e7eb] bg-[#f8faf8]">
                            <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Variant Info</th>
                            <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Stock</th>
                            <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Reserved</th>
                            <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Low Stock Alert</th>
                            <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">Status</th>
                            <th className="px-5 py-3.5 text-right font-medium text-[#6b7280] sm:px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item.id} className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]">
                                <td className="px-5 py-4 sm:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3f4f6] text-lg">
                                            <Package className="h-5 w-5 text-[#6b7280]" />
                                        </div>
                                        <div>
                                            <span className="block font-medium text-[#1f2937]">
                                                {formatVariant(item.variant)}
                                            </span>
                                            <span className="text-xs text-[#6b7280]">ID: {item.variantId}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 sm:px-6 font-medium text-[#1f2937]">{item.stock}</td>
                                <td className="px-5 py-4 text-[#6b7280] sm:px-6">{item.reservedStock}</td>
                                <td className="px-5 py-4 sm:px-6">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.stock <= item.lowStockAlert ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                        {item.lowStockAlert}
                                    </span>
                                </td>
                                <td className="px-5 py-4 sm:px-6">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.stock > item.lowStockAlert ? "bg-[#0f5132]/10 text-[#0f5132]" : "bg-[#b8860b]/10 text-[#b8860b]"
                                            }`}
                                    >
                                        {item.stock > item.lowStockAlert ? "In Stock" : item.stock > 0 ? "Low Stock" : "Out of Stock"}
                                    </span>
                                </td>
                                <td className="px-5 py-4 sm:px-6">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item.id)}
                                            className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#b8860b]/10 hover:text-[#8f6908]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {inventory.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#6b7280]">
                                    No inventory records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
