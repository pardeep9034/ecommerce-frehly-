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
import ShopProductCard from "@/components/freshly/ShopProductCard";

const ShopProductDetail = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    if (!selectedVariant) return;
    dispatch(
      addToCart({
        product_id: product.id,
        variant_id: selectedVariant.id,
        product_name: product.name,
        image: product.image,
        variant_name: `${selectedVariant.value}${selectedVariant.unit}`,
        quantity: quantity,
        price: selectedVariant.price
      })
    );
  };

  // Fetch Product Data
  const { data: productResponse, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => ProductApi.getProductById(productId),
    enabled: !!productId,
  });

  const product =productResponse?.data;
  const variant=product?.variants|| [];
  const variantIds=variant.map((variant)=>
    variant.id
  )

  // Fetch Variants
  const { variants,variantInfo, isLoading: variantsLoading } = useVariant(productId,variantIds);

  // Default selection for variant
  useEffect(() => {
    if (variantInfo?.length > 0 && !selectedVariant) {
      setSelectedVariant(variantInfo[0]);
    }
  }, [variantInfo, selectedVariant]);

  // Fetch Related Products (same category)
  const categoryName = product?.Category?.name || product?.category || "All";
  console.log("category",product?.category_id)
  const { products: allProductsData ,catProducts} = useProduct(1, 20,"",product?.category_id);
  
  // const relatedProducts = useMemo(() => {
  
  //   return catProducts
    
  // }, [allProductsData, product, categoryName]);

  const isLoading = productLoading || variantsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4 text-center">
        <ArrowLeft className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Can't find this product</h2>
        <p className="mt-2 text-muted-foreground">The product might have been removed or link is broken.</p>
        <Link to="/shop" className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
          Back to Shop
        </Link>
      </div>
    );
  }

  const discount = selectedVariant?.mrp && selectedVariant?.price 
    ? Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-muted pb-20 pt-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/shop" className="hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          
          {/* Image Section */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-4 transition-all hover:shadow-lg">
             {product.is_Organic && (
                <div className="absolute left-6 top-6 z-10 flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-white shadow-md">
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
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {/* {product.Category.name} */}
              </span>
              <h1 className="mt-2 text-4xl font-extrabold text-foreground">
                {product.name}
              </h1>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < Math.floor(product.rating || 4) ? "fill-accent text-accent" : "text-border"}`} 
                  />
                ))}
                <span className="ml-2 text-sm font-bold text-foreground">{product.rating || 4}</span>
              </div>
              <span className="text-sm text-muted-foreground">({product.reviews || 0} Reviews)</span>
              <div className="h-4 w-px bg-border" />
              <span className={`text-sm font-semibold ${product.status ? "text-success" : "text-destructive"}`}>
                {product.status ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <div className="mb-8 p-6 rounded-2xl bg-white border border-border shadow-sm">
              {selectedVariant ? (
                <>
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-4xl font-extrabold text-primary">₹{selectedVariant.price}</span>
                    {selectedVariant.mrp && (
                      <>
                        <span className="text-xl text-muted-foreground line-through mb-1">₹{selectedVariant.mrp}</span>
                        <span className="mb-1 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                          {discount}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Variants Selector */}
                  <div className="mb-8">
                    <label className="block text-sm font-bold text-foreground mb-3">
                      Select Pack Size
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {variantInfo.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 px-5 py-3 transition-all ${
                            selectedVariant.id === v.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border bg-white text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-sm font-bold">{v.variant_name} </span>
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
                <div className="flex h-12 items-center rounded-xl border border-border bg-muted p-1 shadow-inner">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-all hover:bg-white hover:shadow-sm"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-foreground">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-all hover:bg-white hover:shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[200px] flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Features Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground">Free Shipping</p>
                  <p className="text-[10px] text-muted-foreground">On orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border">
                <RotateCcw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground">Easy Returns</p>
                  <p className="text-[10px] text-muted-foreground">7-day replacement</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground">Secure Payment</p>
                  <p className="text-[10px] text-muted-foreground">100% payment protection</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-24">
          <div className="mb-10 flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Related Products</h2>
            <div className="mt-4 h-1 w-20 bg-primary rounded-full" />
            <p className="mt-6 max-w-2xl text-base text-muted-foreground">
              Customers who bought this item also explored these organic essentials.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {catProducts?.data?.products?.map((p) => (
  <ShopProductCard
    key={p.id}
    product={p}
  />
))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShopProductDetail;
