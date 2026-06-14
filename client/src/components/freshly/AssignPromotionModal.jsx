import React, { useState } from "react";
import { X, Tag } from "lucide-react";
import usePromotion from "../../hooks/use-promotion";
import { useAddPromotionItemMutation } from "../../hooks/use-promotion-item";
import toast from "react-hot-toast";

const AssignPromotionModal = ({ isOpen, onClose, product, variantId }) => {
    const { promotions: promotionsData, isLoading } = usePromotion(1, 100);
    const [selectedPromotionId, setSelectedPromotionId] = useState("");

    // We can't initialize the mutation until we have a promotionId, so we will call the API directly if needed,
    // OR we use the mutation hook dynamically. Since the hook requires a promotionId, it's safer to have a dynamic one.
    // However, react hooks can't be called conditionally. We'll initialize it with the selected one.
    const addMutation = useAddPromotionItemMutation(selectedPromotionId);

    if (!isOpen || !product) return null;

    const promotionsList = promotionsData?.data?.promotions || promotionsData?.data || promotionsData?.promotions || [];
    const activePromotions = promotionsList.filter(p => p.isActive);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedPromotionId) return;

        addMutation.mutate({
            productId:product.id,
            variantId:variantId,
        }, {
            onSuccess: () => {
                setSelectedPromotionId("");
                onClose();
            },
            onError: (err) => {
                // If the error indicates it's already assigned, toast will handle it via the hook
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
                        Assign Promotion
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Select an active promotion to assign to <strong>{product.name}</strong>.
                        </p>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Promotion <span className="text-red-500">*</span></label>
                        {isLoading ? (
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
                            disabled={!selectedPromotionId || addMutation.isPending || activePromotions.length === 0}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50 flex justify-center items-center"
                        >
                            {addMutation.isPending ? "Assigning..." : "Assign"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignPromotionModal;
