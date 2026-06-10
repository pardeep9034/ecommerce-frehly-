import React, { useState } from "react";
import { Star, ShoppingCart, Eye, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cartSlice";
import { useAddToCartMutation } from "@/hooks/use-addToCart";


const ShopProductCard = ({ product, viewMode = "grid" }) => {
  console.log("product",product)
  const {
    id,
    name,
    price,
    oldPrice,
    image,
    rating = 4,
    status = true,
    Category,
    variants = []
  } = (product.Product || product);
  const dispatch = useDispatch();

  const [selectedVariant, setSelectedVariant] = useState(variants?.[0] || {});
  // const [cart,setCart]=useState(JSON.parse(localStorage.getItem("cart") || "[]"))
  
  const currentPrice = selectedVariant.price || price;
  const currentMrp = selectedVariant.mrp || oldPrice;
  const discount = currentMrp ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const isList = viewMode === "list";
  const addToCartMutation = useAddToCartMutation();

const handleAddToCart = () => {
  dispatch(
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: name,
      image: image,
      variantName: `${selectedVariant.value}${selectedVariant.unit}`,
      quantity: 1,
      priceSnapshot: currentPrice
    })
  );

addToCartMutation.mutate({
  productId: product.id,
  variantId: selectedVariant.id,
  quantity:1
})
    
};
    
  

  return (
    <div className={`group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-[#e5e7eb] bg-white transition-all duration-500 hover:border-[#16a34a]/30 hover:shadow-2xl hover:shadow-green-900/5 ${
      isList ? "flex flex-col sm:flex-row p-3 sm:p-4 gap-4 sm:gap-6" : "flex flex-col h-full"
    }`}>
      
      {/* Badge (Sale) */}
      {discount > 0 && (
        <div className="absolute left-2 top-2 sm:left-4 sm:top-4 z-10 rounded-full bg-[#ea580c] px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">
          Save {discount}%
        </div>
      )}

      {/* Wishlist Button */}
      <button className="absolute right-2 top-2 sm:right-4 sm:top-4 z-10 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#6b7280] backdrop-blur-md transition-all hover:bg-[#ef4444] hover:text-white shadow-sm opacity-0 group-hover:opacity-100">
        <Heart className="h-5 w-5" />
      </button>

      {/* Image Container */}
      <div className={`relative overflow-hidden bg-[#f9fafb] rounded-[1rem] sm:rounded-[1.5rem] shrink-0 ${
        isList ? "w-full sm:w-48 lg:w-64 aspect-square" : "aspect-square"
      }`}>
        <img
          src={image || "/placeholder.png"}
          alt={name}
          className="h-full w-full object-contain p-2 sm:p-4 transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Quick Actions Overlay (Grid only) */}
        {!isList && (
          <div className="absolute inset-x-0 bottom-4 hidden sm:flex items-center justify-center gap-2 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <Link 
              to={`/products/${id}`} 
              className="flex h-11 items-center gap-2 rounded-full bg-[#1f2937] px-6 text-xs font-bold text-white shadow-xl hover:bg-[#0f5132] transition-colors"
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-1 flex-col ${isList ? "py-1 sm:py-2" : "p-3 sm:p-6"}`}>
     
        
        <Link to={`/products/${id}`} className="mb-1 sm:mb-2 line-clamp-1 text-xs sm:text-lg font-black text-[#1f2937] hover:text-[#0f5132] transition-colors tracking-tight">
          {name}
        </Link>

        {/* Rating - Hide on small mobile to save space if needed, or keep compact */}
        <div className="mb-2 sm:mb-4 flex items-center gap-1 hidden sm:block md:block lg:block xl:block">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ${
                  i < Math.floor(rating) ? "fill-[#fbbf24] text-[#fbbf24]" : "text-[#e5e7eb]"
                }`}
              />
            ))}
          </div>
          {/* <span className="ml-1 text-[10px] sm:text-xs font-bold text-[#6b7280]">{rating}</span> */}
        </div>

        {/* Variant Selector - Compact on mobile */}
        {variants?.length > 1? (
          <div className="mb-3 sm:mb-6">
            <select
              value={variants.indexOf(selectedVariant)}
              onChange={(e) => setSelectedVariant(variants[e.target.value])}
              className="w-full rounded-lg sm:rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-[#4b5563] outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5"
            >
              {variants.map((v, index) => (
                <option key={index} value={index}>
                  {v.value}{v.unit} - ₹{v.price}
                </option>
              ))}
            </select>
          </div>
        ):
        (
          <div className="mb-3 sm:mb-6">
            <span className="w-full rounded-lg sm:rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-[#4b5563] outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5">{variants[0].value}{variants[0].unit}</span>
            
            </div>
        )
        
        }

        {/* Price & Action */}
        <div className={`mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 ${isList ? "pt-3 sm:pt-4 border-t border-[#f3f4f6]" : ""}`}>
          <div className="flex items-baseline gap-1.5 sm:gap-3">
            <>
            <span className="text-sm sm:text-2xl font-black text-[#0f5132]">₹{currentPrice}</span>
            {currentMrp > currentPrice && (
              <span className="text-[10px] sm:text-sm font-bold text-[#9ca3af] line-through">₹{currentMrp}</span>
            )}</>
             <button onClick={handleAddToCart} className="flex h-9 sm:h-12 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#0f5132] px-3 sm:px-6 text-[10px] sm:text-sm font-black text-white shadow-lg shadow-green-900/20 transition-all hover:scale-105 hover:bg-[#0b4128] active:scale-95 group/cart overflow-hidden relative">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5 transition-transform " />
            
         
            
          </button>
          </div>
          
          
        </div>
        
        {isList && (
           <p className="mt-4 text-sm text-[#6b7280] line-clamp-2 leading-relaxed">
             Our premium organic products are sourced directly from sustainable farms to ensure the highest quality and freshness for your kitchen.
           </p>
        )}
      </div>
    </div>
  );
};

const Plus = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

export default ShopProductCard;
