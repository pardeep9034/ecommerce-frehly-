import React from 'react'
import { ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useProduct from "../../hooks/use-product";
import ShopProductCard from './ShopProductCard';

export const PopularProducts = () => {
    const { products: productsData, isLoading, error } = useProduct(1, 8);
    
    const products = productsData?.data?.products || productsData?.products || [];

    if (isLoading) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#0f5132]" />
            </div>
          </div>
        )
    }

    if (error) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-12 text-center text-red-500 font-medium">
            Failed to load popular products.
          </div>
        )
    }

  return (
    <section className="w-full py-4 lg:py-12">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1f2937] sm:text-4xl tracking-tight">Popular Products</h2>
            <div className="mt-1.5 h-1 w-8 rounded-full bg-[#16a34a]"></div>
          </div>
          <Link 
            to="/shop" 
            className="group flex items-center gap-1 text-xs font-black text-[#0f5132] hover:text-[#16a34a] transition-all"
          >
            View All
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
