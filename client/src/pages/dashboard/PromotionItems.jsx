import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePromotionItemsQuery, useRemovePromotionItemMutation } from "@/hooks/use-promotion-item";
import useProducts  from "@/hooks/use-product";
import usePromotion from "@/hooks/use-promotion";
import { Plus, Search, Trash2, PackageSearch, Info } from "lucide-react";
import PromotionItemModal from "@/components/dashboard/PromotionItemModal";
import PromotionEditCard from "@/components/dashboard/PromotionEditCard";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import PageHeader from "@/components/dashboard/PageHeader";

const getPromoStatus = (promo) => {
    const now = Date.now();
    const start = promo.startDate ? new Date(promo.startDate).getTime() : null;
    const end = promo.endDate ? new Date(promo.endDate).getTime() : null;
    if (!promo.isActive || (end && end < now)) return "Ended";
    if (start && start > now) return "Scheduled";
    return "Live";
};

const PromotionItems = () => {
    const { promotionId } = useParams();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Queries
    const { data: promotionItems, isLoading: isLoadingItems } = usePromotionItemsQuery(promotionId);
    const { promotions: promotionData, isLoading: isLoadingPromotion, updatePromotion } = usePromotion(1, 100);

    // Mutations
    const removeMutation = useRemovePromotionItemMutation(promotionId);

    const handleSavePromotion = (payload) => {
        updatePromotion.mutate({ id: Number(promotionId), data: payload });
    };

    if (isLoadingItems || isLoadingPromotion) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-8 h-8 w-64 rounded skeleton-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                            <div className="h-4 w-24 rounded skeleton-shimmer" style={{ animationDelay: `${i * 80}ms` }} />
                            <div className="mt-3 h-7 w-16 rounded skeleton-shimmer" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                        </div>
                    ))}
                </div>
                <TableSkeleton rows={5} columns={6} />
            </div>
        );
    }

    const promotion = promotionData?.promotions?.find(p => p.id === parseInt(promotionId));
    
    if (!promotion) {
        return (
            <div className="p-8">
                <PageHeader title="Promotion not found" backTo="/admin/promotions" backLabel="Back to Promotions" />
            </div>
        );
    }

    const filteredItems = promotionItems?.filter(item => 
        item.Product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.Product?.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleRemoveItem = (id) => {
        if (window.confirm("Are you sure you want to remove this product from the promotion?")) {
            removeMutation.mutate(id);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <PageHeader
                    title={promotion.title}
                    description="Manage products included in this promotion."
                    backTo="/admin/promotions"
                    backLabel="Back to Promotions"
                    action={
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    }
                />
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="w-full lg:w-[420px] lg:shrink-0">
                <PromotionEditCard promotion={promotion} status={getPromoStatus(promotion)} onSave={handleSavePromotion} />
            </div>

            <div className="min-w-0 flex-1">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-foreground shrink-0 mr-4">
                    Products in this promotion · {promotionItems?.length || 0}
                </h2>
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search items by product or brand name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-success"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-medium text-gray-500">Product</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Brand</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Specific Variant</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Original Price</th>
                                <th className="p-4 text-sm font-medium text-gray-500">Promotional Price</th>
                                <th className="p-4 text-sm font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const product = item.Product;
                                    const variant = item.ProductVariant;
                                    const image = product?.images?.[0] || "https://placehold.co/100x100?text=No+Image";
                                    
                                    // Use main product price or variant price depending on what was selected
                                    let originalPrice = variant ? variant.price : (product?.variants?.[0]?.price || 0);
                                    let promoPrice = promotion.discountType === 'PERCENT' 
                                        ? originalPrice - (originalPrice * (promotion.discountValue / 100))
                                        : originalPrice - promotion.discountValue;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition duration-150">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={image} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                                    <span className="font-medium text-gray-900">{product?.name || "Unknown Product"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {product?.brand || "-"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {variant ? `${variant.value} ${variant.unit} (${variant.unitType})` : "All Variants"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 line-through">
                                                ${originalPrice.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-success">
                                                ${Math.max(0, promoPrice).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-2 text-destructive hover:bg-destructive rounded-lg transition-colors"
                                                    title="Remove from Promotion"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        <PackageSearch className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-900 mb-1">No products found</p>
                                        <p className="text-sm text-gray-500">Add products to this promotion to see them here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                A product in two live promotions uses the one with the lower priority number.
            </div>
            </div>
            </div>

            {/* Add Product Modal */}
            <PromotionItemModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                promotionId={promotionId}
                existingItems={promotionItems || []}
            />
        </div>
    );
};

export default PromotionItems;
