import React, { useState } from "react";
import { X } from "lucide-react";
import useProduct from "../../hooks/use-product";
import { useAddPromotionItemMutation } from "../../hooks/use-promotion-item";

const PromotionItemModal = ({ isOpen, onClose, promotionId, existingItems }) => {
    const { products: productsData, isLoading } = useProduct(1, 100);
    const addMutation = useAddPromotionItemMutation(promotionId);

    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedVariantId, setSelectedVariantId] = useState("");

    if (!isOpen) return null;

    const products = productsData?.data?.products || [];
    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
    const variants = selectedProduct?.variants || [];

    const existingProductIds = existingItems?.map(item => item.productId) || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProductId) return;

        addMutation.mutate({
            productId: parseInt(selectedProductId),
            variantId: selectedVariantId ? parseInt(selectedVariantId) : null,
        }, {
            onSuccess: () => {
                setSelectedProductId("");
                setSelectedVariantId("");
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Add Product</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Product <span className="text-red-500">*</span></label>
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
                            {products.map((product) => (
                                <option 
                                    key={product.id} 
                                    value={product.id}
                                    disabled={existingProductIds.includes(product.id) && !selectedVariantId} // Can add again if picking a specific variant instead of whole product, but usually we just disable
                                >
                                    {product.name} ({product.brand}) {existingProductIds.includes(product.id) ? "- Already added" : ""}
                                </option>
                            ))}
                        </select>
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
                            <p className="text-xs text-gray-500 mt-2">Leave unselected to apply the promotion to the entire product.</p>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition duration-200 font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedProductId || addMutation.isPending}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50"
                        >
                            {addMutation.isPending ? "Adding..." : "Add to Promotion"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromotionItemModal;
