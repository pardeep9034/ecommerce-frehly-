import React, { useState } from "react";
import { X, Tag } from "lucide-react";
import usePromotion from "../../hooks/use-promotion";
import useProduct from "../../hooks/use-product";
import { useAddPromotionItemMutation, useAllPromotionItemsQuery } from "../../hooks/use-promotion-item";
import toast from "react-hot-toast";

const MasterAssignModal = ({ isOpen, onClose }) => {
    // Queries
    const { promotions: promotionsData, isLoading: isLoadingPromos } = usePromotion(1, 100);
    const { products: productsData, isLoading: isLoadingProducts } = useProduct(1, 100);
    const { refetch } = useAllPromotionItemsQuery();

    const [selectedPromotionId, setSelectedPromotionId] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedVariantId, setSelectedVariantId] = useState("");

    // Mutation
    // The hook requires a promotionId to invalidate the specific promotion's list, 
    // but we can pass the currently selected one dynamically.
    const addMutation = useAddPromotionItemMutation(selectedPromotionId);

    if (!isOpen) return null;

    const promotionsList = promotionsData?.data?.promotions || promotionsData?.data || promotionsData?.promotions || [];
    const activePromotions = promotionsList.filter(p => p.isActive);

    const productsList = productsData?.data?.products || productsData?.products || [];
    const selectedProduct = productsList.find(p => p.id === parseInt(selectedProductId));
    const variants = selectedProduct?.variants || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPromotionId || !selectedProductId) return;

        addMutation.mutate({
            productId: parseInt(selectedProductId),
            variantId: selectedVariantId ? parseInt(selectedVariantId) : null,
        }, {
            onSuccess: () => {
                setSelectedPromotionId("");
                setSelectedProductId("");
                setSelectedVariantId("");
                refetch(); // Manually refetch the "all promotion items" query since the mutation only invalidates the specific promotion's query
                onClose();
            },
            onError: (err) => {
                console.error(err);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-green-50/50">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-green-600" />
                        New Assignment
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Product <span className="text-red-500">*</span></label>
                        {isLoadingProducts ? (
                            <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                        ) : (
                            <select
                                value={selectedProductId}
                                onChange={(e) => {
                                    setSelectedProductId(e.target.value);
                                    setSelectedVariantId("");
                                }}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                <option value="">Select a product...</option>
                                {productsList.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({product.brand})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {selectedProductId && variants.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Specific Variant (Optional)</label>
                            <select
                                value={selectedVariantId}
                                onChange={(e) => setSelectedVariantId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                <option value="">All Variants</option>
                                {variants.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.value} {v.unit} ({v.unitType}) - ${v.price}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">Leave unselected to apply to all variants.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Promotion <span className="text-red-500">*</span></label>
                        {isLoadingPromos ? (
                            <div className="animate-pulse h-10 bg-gray-100 rounded-lg"></div>
                        ) : activePromotions.length === 0 ? (
                            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                                No active promotions found. Please create one first!
                            </p>
                        ) : (
                            <select
                                value={selectedPromotionId}
                                onChange={(e) => setSelectedPromotionId(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                <option value="">Select a promotion...</option>
                                {activePromotions.map((promo) => (
                                    <option key={promo.id} value={promo.id}>
                                        {promo.title} ({promo.discountType === 'PERCENT' ? `${promo.discountValue}% Off` : `₹${promo.discountValue} Off`})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition duration-200 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedProductId || !selectedPromotionId || addMutation.isPending || activePromotions.length === 0}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50 flex justify-center items-center"
                        >
                            {addMutation.isPending ? "Assigning..." : "Assign Promotion"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MasterAssignModal;
