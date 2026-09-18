import { Edit2, Trash2, Package } from "lucide-react";
import { useEffect, useRef } from "react";

const formatVariant = (variant) => {
    if (!variant) return "Unknown Variant";
    
    const productName = variant.product?.name ||"";
    const prefix = productName ? `${productName} - ` : "";

   
    return `${prefix}${variant.quantity} ${variant.measurementUnit.code}`;
};

const InventoryTable = ({ inventory, onEdit, onDelete, highlightTerm }) => {
    const highlightRef = useRef(null);

    const firstMatchId = highlightTerm
        ? inventory.find((item) => String(item.variant_id || "").toLowerCase().includes(String(highlightTerm || "").toLowerCase()))?.id
        : null;

    useEffect(() => {
        if (highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    }, [highlightTerm, firstMatchId]);

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted">
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Variant Info</th>
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Stock</th>
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Reserved</th>
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Low Stock Alert</th>
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Status</th>
                            <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => {
                            const highlight = highlightTerm && String(item.variant_id || "").toLowerCase().includes(String(highlightTerm || "").toLowerCase());
                            return (
                            <tr key={item.id} className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${highlight ? 'bg-yellow-50 ring-1 ring-yellow-300' : ''}`}>
                                <td className="px-5 py-4 sm:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <span className="block font-medium text-foreground">
                                                {formatVariant(item.variant)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">ID: {item.variant_id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 sm:px-6 font-medium text-foreground">{item.current_stock}</td>
                                <td className="px-5 py-4 text-muted-foreground sm:px-6">{item.reserved_stock}</td>
                                <td className="px-5 py-4 sm:px-6">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.current_stock <= item.low_stock_threshold ? "bg-destructive text-destructive" : "bg-blue-50 text-blue-600"}`}>
                                        {item.low_stock_threshold}
                                    </span>
                                </td>
                                <td className="px-5 py-4 sm:px-6">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.current_stock > item.low_stock_threshold ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                            }`}
                                    >
                                        {item.current_stock > item.low_stock_threshold ? "In Stock" : item.current_stock > 0 ? "Low Stock" : "Out of Stock"}
                                    </span>
                                </td>
                                <td className="px-5 py-4 sm:px-6">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item)}
                                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item.id)}
                                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning-foreground"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {inventory.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
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
