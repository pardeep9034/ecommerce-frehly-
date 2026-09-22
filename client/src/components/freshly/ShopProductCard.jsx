import React, { useState, useEffect, useMemo } from "react";
import { Star, ShoppingCart, Eye, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cartSlice";
import useProduct from "@/hooks/use-product";
import useVariant from "@/hooks/use-variant";
import useInventory from "@/hooks/use-inventory";
import { useAddToCartMutation } from "@/hooks/use-addToCart";


const ShopProductCard = ({ product, viewMode = "grid" }) => {
  console.log("test product",product)
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
  console.log("variants on home",variants)


  // const [cart,setCart]=useState(JSON.parse(localStorage.getItem("cart") || "[]"))


  const isList = viewMode === "list";
  const addToCartMutation = useAddToCartMutation();

  // Parent (Shop.jsx) may already pass merged variants annotated with `in_stock`.
  // When it hasn't (e.g. ShopProductDetail's related-products strip), self-fetch.
  const preloadedVariants =
    Array.isArray(product.variants) && product.variants.every((v) => "in_stock" in v)
      ? product.variants
      : null;

  const fallbackProductId = preloadedVariants ? null : product?.id;
  const { productById } = useProduct({ id: fallbackProductId });
  const fallbackVariantIds = preloadedVariants
    ? []
    : (productById?.data?.variants || []).map((v) => v.id);
  const { variantInfo } = useVariant({ variantIds: fallbackVariantIds });
  const { inStockVariantIds } = useInventory(undefined, undefined, undefined, fallbackVariantIds);

  const variantData = useMemo(() => {
    if (preloadedVariants) return preloadedVariants.filter((v) => v.in_stock);
    const all = variantInfo || [];
    if (!inStockVariantIds) return all; // not resolved yet, show unfiltered rather than flash empty
    const inStockSet = new Set(inStockVariantIds.map(Number));
    return all.filter((v) => inStockSet.has(Number(v.id)));
  }, [preloadedVariants, variantInfo, inStockVariantIds]);

  const totalVariantCount = preloadedVariants
    ? preloadedVariants.length
    : (productById?.data?.variants?.length || 0);
  const isOutOfStock = totalVariantCount > 0 && variantData.length === 0;

  const [selectedVariant, setSelectedVariant] = useState(variantData?.[0] || {});
  useEffect(() => {
  if (variantData?.length > 0) {
    setSelectedVariant(variantData[0]);
  }
}, [variantData]);

  const currentPrice = selectedVariant.price || price;
  const currentMrp = selectedVariant.mrp || oldPrice;
  const discount = currentMrp ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
const handleAddToCart = () => {
  if (isOutOfStock || !selectedVariant?.id) return;
  addToCartMutation.mutate(
    {
      variant_id: selectedVariant.id,
      quantity: 1
    },
    {
      onSuccess: (response) => {
        const cartItem = response?.data?.data;
        dispatch(
          addToCart({
            id: cartItem?.id,
            cart_id: cartItem?.cart_id,
            product_id: product.id,
            variant_id: selectedVariant.id,
            product_name: name,
            image: image,
            variant_name: selectedVariant.variant_name,
            quantity: 1,
            price: currentPrice
          })
        );
      }
    }
  );
};
    
  

  return (
    <div className={`group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-border bg-white transition-all duration-500 hover:border-success/30 hover:shadow-2xl hover:shadow-success/5 ${
      isList ? "flex flex-col sm:flex-row p-3 sm:p-4 gap-4 sm:gap-6" : "flex flex-col h-full"
    }`}>
      
      {/* Badge (Sale) */}
      {discount > 0 && !isOutOfStock && (
        <div className="absolute left-2 top-2 sm:left-4 sm:top-4 z-10 rounded-full bg-accent px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20">
          Save {discount}%
        </div>
      )}

      {/* Out of Stock overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
          <span className="rounded-full bg-foreground px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-lg">
            Out of Stock
          </span>
        </div>
      )}

      {/* Wishlist Button */}
      <button className="absolute right-2 top-2 sm:right-4 sm:top-4 z-10 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-muted-foreground backdrop-blur-md transition-all hover:bg-destructive hover:text-white shadow-sm opacity-0 group-hover:opacity-100">
        <Heart className="h-5 w-5" />
      </button>

      {/* Image Container */}
      <div className={`relative overflow-hidden bg-muted rounded-[1rem] sm:rounded-[1.5rem] shrink-0 ${
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
              className="flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-xs font-bold text-white shadow-xl hover:bg-primary transition-colors"
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-1 flex-col ${isList ? "py-1 sm:py-2" : "p-3 sm:p-6"}`}>
     
        
        <Link to={`/products/${id}`} className="mb-1 sm:mb-2 line-clamp-1 text-xs sm:text-lg font-black text-foreground hover:text-primary transition-colors tracking-tight">
          {name}
        </Link>

        {/* Rating - Hide on small mobile to save space if needed, or keep compact */}
        <div className="mb-2 sm:mb-4 flex items-center gap-1 hidden sm:block md:block lg:block xl:block">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ${
                  i < Math.floor(rating) ? "fill-accent text-accent" : "text-border"
                }`}
              />
            ))}
          </div>
          {/* <span className="ml-1 text-[10px] sm:text-xs font-bold text-muted-foreground">{rating}</span> */}
        </div>

        {/* Variant Selector - Compact on mobile */}
        {variantData?.length > 1? (
          <div className="mb-3 sm:mb-6">
            <select
              value={variantData.indexOf(selectedVariant)}
              onChange={(e) => setSelectedVariant(variantData[e.target.value])}
              className="w-full rounded-lg sm:rounded-xl border border-border bg-muted px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-muted-foreground outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
            >
              {variantData.map((v, index) => (
                <option key={index} value={index}>
                 {v.variant_name} - ₹{v.price}
                </option>
              ))}
            </select>
          </div>
        ):
        (
          <div className="mb-3 sm:mb-6">
            <span className="w-full rounded-lg sm:rounded-xl border border-border bg-muted px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-muted-foreground outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5">{selectedVariant?.variant_name}</span>
            
            </div>
        )
        
        }

        {/* Price & Action */}
        <div className={`mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 ${isList ? "pt-3 sm:pt-4 border-t border-muted" : ""}`}>
          <div className="flex items-baseline gap-1.5 sm:gap-3">
            <>
            <span className="text-sm sm:text-2xl font-black text-primary">₹{currentPrice}</span>
            {currentMrp > currentPrice && (
              <span className="text-[10px] sm:text-sm font-bold text-muted-foreground line-through">₹{currentMrp}</span>
            )}</>
             <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex h-9 sm:h-12 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-primary px-3 sm:px-6 text-[10px] sm:text-sm font-black text-white shadow-lg shadow-success/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 group/cart overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-5 sm:w-5 transition-transform " />



          </button>
          </div>
          
          
        </div>
        
        {isList && (
           <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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
