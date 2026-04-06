import React, { useState, useEffect, useMemo } from "react";
import { 
  Star, 
  ShoppingCart, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Plus,
  Minus,
  Leaf,
  Loader2
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cartSlice";
import { useQuery } from "@tanstack/react-query";
import ProductApi from "@/apis/productApi";
import useVariant from "@/hooks/use-variant";
import useProduct from "@/hooks/use-product";
import ShopProductCard from "../components/common/ShopProductCard";

const ShopProductDetail = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    if (!selectedVariant) return;
    dispatch(
      addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        image: product.image,
        variantName: `${selectedVariant.value}${selectedVariant.unit}`,
        quantity: quantity,
        priceSnapshot: selectedVariant.price
      })
    );
  };

  // Fetch Product Data
  const { data: productResponse, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => ProductApi.getProductById(productId),
    enabled: !!productId,
  });

  const product = productResponse?.data;

  // Fetch Variants
  const { variants, isLoading: variantsLoading } = useVariant(productId);

  // Default selection for variant
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  // Fetch Related Products (same category)
  const categoryName = product?.Category?.name || product?.category || "All";
  const { products: allProductsData } = useProduct(1, 20);
  
  const relatedProducts = useMemo(() => {
    if (!allProductsData?.data?.products || !product) return [];
    return allProductsData.data.products
      .filter(p => p.id !== product.id && (p.Category?.name === categoryName || p.category === categoryName))
      .slice(0, 4);
  }, [allProductsData, product, categoryName]);

  const isLoading = productLoading || variantsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb]">
        <Loader2 className="h-10 w-10 animate-spin text-[#0f5132]" />
        <p className="mt-4 text-sm font-medium text-[#6b7280]">Loading product details...</p>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb] p-4 text-center">
        <ArrowLeft className="mb-4 h-12 w-12 text-[#6b7280]" />
        <h2 className="text-xl font-bold text-[#1f2937]">Can't find this product</h2>
        <p className="mt-2 text-[#6b7280]">The product might have been removed or link is broken.</p>
        <Link to="/shop" className="mt-6 rounded-lg bg-[#0f5132] px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0f5132]/20 hover:bg-[#0b4128]">
          Back to Shop
        </Link>
      </div>
    );
  }

  const discount = selectedVariant?.mrp && selectedVariant?.price 
    ? Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-20 pt-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-[#6b7280]">
          <Link to="/shop" className="hover:text-[#0f5132] flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <span className="text-[#e5e7eb]">/</span>
          <span className="text-[#1f2937] font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          
          {/* Image Section */}
          <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-4 transition-all hover:shadow-lg">
             {product.isOrganic && (
                <div className="absolute left-6 top-6 z-10 flex items-center gap-1.5 rounded-full bg-[#16a34a] px-3 py-1.5 text-xs font-bold text-white shadow-md">
                   <Leaf className="h-3.5 w-3.5" />
                   Organic
                </div>
            )}
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-full w-full rounded-xl object-cover"
            />
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-[#6b7280]">
                {product.Category.name}
              </span>
              <h1 className="mt-2 text-4xl font-extrabold text-[#1f2937]">
                {product.name}
              </h1>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < Math.floor(product.rating || 4) ? "fill-[#fbbf24] text-[#fbbf24]" : "text-[#e5e7eb]"}`} 
                  />
                ))}
                <span className="ml-2 text-sm font-bold text-[#1f2937]">{product.rating || 4}</span>
              </div>
              <span className="text-sm text-[#6b7280]">({product.reviews || 0} Reviews)</span>
              <div className="h-4 w-px bg-[#e5e7eb]" />
              <span className={`text-sm font-semibold ${product.status ? "text-[#16a34a]" : "text-red-500"}`}>
                {product.status ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <p className="mb-8 text-lg leading-relaxed text-[#4b5563]">
              {product.description}
            </p>

            <div className="mb-8 p-6 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm">
              {selectedVariant ? (
                <>
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-4xl font-extrabold text-[#0f5132]">₹{selectedVariant.price}</span>
                    {selectedVariant.mrp && (
                      <>
                        <span className="text-xl text-[#6b7280] line-through mb-1">₹{selectedVariant.mrp}</span>
                        <span className="mb-1 rounded-md bg-[#ea580c] px-2 py-0.5 text-xs font-bold text-white">
                          {discount}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Variants Selector */}
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-[#1f2937] mb-3">
                      Select Pack Size
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 px-5 py-3 transition-all ${
                            selectedVariant.id === v.id 
                              ? "border-[#0f5132] bg-[#0f5132]/5 text-[#0f5132]" 
                              : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#0f5132]/30"
                          }`}
                        >
                          <span className="text-sm font-bold">{v.value} {v.unit}</span>
                          <span className="text-xs font-medium opacity-70">₹{v.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-6 flex flex-col gap-2">
                   <div className="h-10 w-32 animate-pulse bg-gray-100 rounded" />
                   <div className="h-14 w-full animate-pulse bg-gray-100 rounded" />
                </div>
              )}

              {/* Quantity */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex h-12 items-center rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-1 shadow-inner">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#1f2937] transition-all hover:bg-white hover:shadow-sm"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-[#1f2937]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#1f2937] transition-all hover:bg-white hover:shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[200px] flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-8 py-3 text-base font-bold text-white shadow-lg shadow-[#0f5132]/20 transition-all hover:scale-105 hover:bg-[#0b4128]"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Features Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#e5e7eb]">
                <Truck className="h-5 w-5 text-[#0f5132]" />
                <div>
                  <p className="text-xs font-bold text-[#1f2937]">Free Shipping</p>
                  <p className="text-[10px] text-[#6b7280]">On orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#e5e7eb]">
                <RotateCcw className="h-5 w-5 text-[#0f5132]" />
                <div>
                  <p className="text-xs font-bold text-[#1f2937]">Easy Returns</p>
                  <p className="text-[10px] text-[#6b7280]">7-day replacement</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#e5e7eb]">
                <ShieldCheck className="h-5 w-5 text-[#0f5132]" />
                <div>
                  <p className="text-xs font-bold text-[#1f2937]">Secure Payment</p>
                  <p className="text-[10px] text-[#6b7280]">100% payment protection</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-24">
          <div className="mb-10 flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-extrabold text-[#1f2937] sm:text-4xl">Related Products</h2>
            <div className="mt-4 h-1 w-20 bg-[#0f5132] rounded-full" />
            <p className="mt-6 max-w-2xl text-base text-[#6b7280]">
              Customers who bought this item also explored these organic essentials.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ShopProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShopProductDetail;
