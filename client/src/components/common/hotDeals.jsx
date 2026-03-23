import React from 'react'
import { Zap, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useProduct from "../../hooks/use-product";
import ShopProductCard from './ShopProductCard';

export const HotDeals = () => {
    const { products: productsData, isLoading, error } = useProduct(1, 4);
    
    const deals = productsData?.data?.products || productsData?.products || [];

    if (isLoading) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0f5132] mx-auto" />
          </div>
        )
    }

  return (
    <section className="w-full py-12 lg:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-orange-100/50 text-orange-600 shadow-sm">
               <Zap className="h-7 w-7 fill-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#1f2937] sm:text-4xl tracking-tighter">Hot Deals</h2>
              <p className="mt-1 text-sm font-bold text-[#6b7280]">Freshly picked savings just for you.</p>
            </div>
          </div>
          <Link 
            to="/shop" 
            className="group flex items-center gap-1.5 text-sm font-black text-orange-600 hover:text-orange-700 transition-all"
          >
            See All Deals 
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((deal) => (
            <ShopProductCard key={deal.id} product={deal} />
          ))}
        </div>
      </div>
    </section>
  )
}
