import React from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCategory from "../../hooks/use-category";

export const PopularCategories = () => {
    const { categories: categoriesData, isLoading, error } = useCategory(1, 10);
    
    // Safety check for data structure
    const categories = categoriesData?.data?.categories || categoriesData?.categories || [];

    if (isLoading) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex animate-pulse space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-6 w-1/4 rounded bg-gray-200"></div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-40 rounded-2xl bg-gray-200"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
    }

    if (error) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-12 text-center text-red-500">
            Error loading categories: {error.message}
          </div>
        )
    }

  return (
    <section className="w-full py-4 lg:py-6">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1f2937] sm:text-4xl tracking-tight">Popular Categories</h2>
            <div className="mt-1.5 h-1 w-8 rounded-full bg-[#16a34a]"></div>
          </div>
          <Link 
            to="/shop" 
            className="group flex items-center gap-1 text-xs font-bold text-[#0f5132] hover:text-[#16a34a] transition-colors"
          >
            See All 
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {categories.slice(0, 9).map((category) => (
            <Link 
              key={category.id} 
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center justify-center rounded-2xl sm:rounded-[2.5rem] border border-[#e5e7eb] bg-white p-2 sm:p-4 transition-all duration-300 hover:border-[#16a34a] hover:shadow-2xl hover:shadow-green-900/10 active:scale-95"
            >
              <div className="mb-2 h-10 w-10 sm:h-16 sm:w-16 overflow-hidden rounded-xl sm:rounded-3xl bg-gray-50 p-2 sm:p-4 transition-transform duration-500 group-hover:scale-110">
                <img 
                  src={category.image || '/placeholder-category.png'} 
                  alt={category.name} 
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-center text-[10px] sm:text-sm font-black text-[#1f2937] group-hover:text-[#0f5132] transition-colors line-clamp-1">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
