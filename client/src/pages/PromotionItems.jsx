import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePromotionItemsQuery, useRemovePromotionItemMutation } from "../hooks/use-promotion-item";
import useProducts  from "../hooks/use-product";
import usePromotion from "../hooks/use-promotion";
import { ArrowLeft, Plus, Search, Trash2, PackageSearch } from "lucide-react";
import PromotionItemModal from "../components/freshly/PromotionItemModal";

const PromotionItems = () => {
    const { promotionId } = useParams();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Queries
    const { data: promotionItems, isLoading: isLoadingItems } = usePromotionItemsQuery(promotionId);
    const { promotions: promotionData, isLoading: isLoadingPromotion } = usePromotion(1, 100);
    
    // Mutations
    const removeMutation = useRemovePromotionItemMutation(promotionId);

    if (isLoadingItems || isLoadingPromotion) {
        return <div className="p-8 text-center text-gray-500">Loading promotion details...</div>;
    }

    const promotion = promotionData?.promotions?.find(p => p.id === parseInt(promotionId));
    
    if (!promotion) {
        return (
            <div className="p-8">
                <button onClick={() => navigate("/dashboard/promotions")} className="flex items-center text-green-600 hover:text-green-700 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Promotions
                </button>
                <div className="text-center text-gray-500">Promotion not found</div>
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <button onClick={() => navigate("/dashboard/promotions")} className="flex items-center text-sm text-gray-500 hover:text-green-600 mb-2 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Promotions
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {promotion.title} Items
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {promotion.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1">Manage products included in this promotion</p>
                </div>
                
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition duration-200 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { title: "Total Items", value: promotionItems?.length || 0, color: "text-blue-600" },
                    { title: "Discount Type", value: promotion.discountType, color: "text-purple-600" },
                    { 
                        title: "Discount Value", 
                        value: `${promotion.discountType === 'FLAT' ? '₹' : ''}${promotion.discountValue}${promotion.discountType === 'PERCENT' ? '%' : ''}`,
                        color: "text-green-600" 
                    }
                ].map((stat) => (
                    <div key={stat.title} className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-[#6b7280]">{stat.title}</p>
                        <p className={`mt-2 text-3xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search items by product or brand name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                                            <td className="p-4 text-sm font-medium text-green-600">
                                                ${Math.max(0, promoPrice).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
