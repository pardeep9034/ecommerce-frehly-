import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAllPromotionItemsQuery, useRemovePromotionItemMutation } from "../hooks/use-promotion-item";
import { Plus, Search, Trash2, Tag, Percent, ArrowLeft } from "lucide-react";
import MasterAssignModal from "../components/freshly/MasterAssignModal";

const AssignPromotions = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: allItems, isLoading } = useAllPromotionItemsQuery();
    // For delete mutation, we don't have a single promotionId for invalidateQueries, 
    // so we pass null and we'll manually invalidate 'allPromotionItems' or we rely on the hook taking 'allPromotionItems' 
    // Wait, the hook `useRemovePromotionItemMutation` invalidates `["promotionItems", promotionId]`.
    // Let's create a special configured version or just use it. It's better to add the generic invalidate in the hook.
    const removeMutation = useRemovePromotionItemMutation(null);

    const [searchTerm, setSearchTerm] = useState("");
    
    // We can't reuse AssignPromotionModal directly to select both Product and Promotion,
    // AssignPromotionModal currently expects a `product` prop and lets you select a `promotion`.
    // Let's create a generic state: instead of selecting A product first, we can navigate to existing products to assign!
    
    const filteredItems = useMemo(() => {
        if (!allItems) return [];
        return allItems.filter(item => {
            const prodName = item.Product?.name?.toLowerCase() || "";
            const promoTitle = item.Promotion?.title?.toLowerCase() || "";
            const search = searchTerm.toLowerCase();
            return prodName.includes(search) || promoTitle.includes(search);
        });
    }, [allItems, searchTerm]);

    const handleRemoveItem = (id) => {
        if (window.confirm("Are you sure you want to remove this promotion assignment?")) {
            removeMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-7">
            {/* Header */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-card sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Tag className="w-6 h-6 text-green-600" />
                            Assigned Promotions
                        </h1>
                        <p className="text-gray-500 mt-1">View all products currently assigned to active promotions</p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5">
                            <Search className="h-4 w-4 text-[#6b7280]" />
                            <input
                                type="text"
                                placeholder="Search product or promotion..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
                            />
                        </div>

                        {/* Open MasterAssignModal to assign a product to a promotion */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Assignment
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="border-b border-[#e5e7eb] bg-[#f8faf8]">
                            <tr>
                                <th className="px-5 py-3.5 font-medium text-[#6b7280]">Product</th>
                                <th className="px-5 py-3.5 font-medium text-[#6b7280]">Promotion</th>
                                <th className="px-5 py-3.5 font-medium text-[#6b7280]">Discount</th>
                                <th className="px-5 py-3.5 font-medium text-[#6b7280]">Original Price</th>
                                <th className="px-5 py-3.5 font-medium text-[#6b7280]">Promo Price</th>
                                <th className="px-5 py-3.5 font-medium text-[#6b7280] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading assignments...</td>
                                </tr>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const product = item.Product;
                                    const variant = item.ProductVariant;
                                    const promotion = item.Promotion;
                                    const image = product?.images?.[0] || "https://placehold.co/100x100?text=No+Image";
                                    
                                    let originalPrice = variant ? variant.price : (product?.variants?.[0]?.price || 0);
                                    let promoPrice = promotion?.discountType === 'PERCENT' 
                                        ? originalPrice - (originalPrice * (promotion.discountValue / 100))
                                        : originalPrice - (promotion?.discountValue || 0);

                                    return (
                                        <tr key={item.id} className="transition-colors hover:bg-[#f9fafb]">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={image} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                                    <div>
                                                        <span className="font-medium text-gray-900 block">{product?.name || "Unknown"}</span>
                                                        <span className="text-xs text-gray-500 block">
                                                            {variant ? `${variant.value} ${variant.unit}` : "All Variants"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-green-700">
                                                {promotion?.title || "-"}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                                                    {promotion?.discountType === 'PERCENT' ? <Percent className="w-3 h-3"/> : '₹'}
                                                    {promotion?.discountValue}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 line-through">
                                                ₹{originalPrice.toFixed(2)}
                                            </td>
                                            <td className="p-4 font-bold text-gray-900">
                                                ₹{Math.max(0, promoPrice).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Unassign Promotion"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-gray-900">No promotions assigned</p>
                                        <p className="text-gray-500 mt-1">Assignments you make will appear here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <MasterAssignModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
};

export default AssignPromotions;
