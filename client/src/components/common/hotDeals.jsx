import React from 'react'
import { Zap, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useProduct from "../../hooks/use-product";
import ShopProductCard from './ShopProductCard';

export const HotDeals = () => {
    const {  isLoading, error, productsByType } = useProduct(1, 4,"HOT");
    console.log(productsByType);
    const deals = productsByType?.data?.data?.products ||[];

    if (isLoading) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0f5132] mx-auto" />
          </div>
        )
    }

  return (
    <section className="w-full py-6 lg:py-12">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.5rem] bg-orange-100/50 text-orange-600 shadow-sm">
               <Zap className="h-4 w-4 fill-orange-600" />
            </div>
            <div>
              <h2 className="text-md font-black text-[#1f2937] sm:text-4xl tracking-tighter">Hot Deals</h2>
              <p className="mt-1 text-xs font-bold text-[#6b7280]">Freshly picked savings just for you.</p>
            </div>
          </div>
          <Link 
            to="/shop" 
            className="group flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 transition-all"
          >
            See All Deals 
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((deal) => (
            <ShopProductCard key={deal.id} product={deal} />
          ))}
        </div>
      </div>
    </section>
  )
}
