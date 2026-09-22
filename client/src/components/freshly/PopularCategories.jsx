import React from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCategory from "@/hooks/use-category";

export const PopularCategories = () => {
    const { categories: categoriesData, isLoading, error } = useCategory(1, 10);
    
    // Safety check for data structure
    const categories = categoriesData?.data?.categories || categoriesData?.categories || [];

    if (isLoading) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-6 w-1/4 rounded skeleton-shimmer"></div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-40 rounded-2xl skeleton-shimmer" style={{ animationDelay: `${i * 80}ms` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
    }

    if (error) {
        return (
          <div className="mx-auto max-w-screen-2xl px-4 py-12 text-center text-destructive">
            Error loading categories: {error.message}
          </div>
        )
    }

  return (
    <section className="w-full py-4 lg:py-6">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-black text-foreground sm:text-4xl tracking-tight">Popular Categories</h2>
            <div className="mt-1.5 h-1 w-8 rounded-full bg-success"></div>
          </div>
          <Link 
            to="/shop" 
            className="group flex items-center gap-1 text-[10px] sm:text-sm font-bold text-primary hover:text-success transition-colors"
          >
            See All 
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {categories.slice(0, 9).map((category) => (
            <Link 
              key={category.id} 
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center justify-center rounded-2xl sm:rounded-[2.5rem] border border-border bg-white p-2 sm:p-4 transition-all duration-300 hover:border-success hover:shadow-2xl hover:shadow-success/10 active:scale-95"
            >
              <div className="mb-2 h-10 w-10 sm:h-16 sm:w-16 overflow-hidden rounded-xl sm:rounded-3xl bg-gray-50 p-2 sm:p-4 transition-transform duration-500 group-hover:scale-110">
                <img 
                  src={category.image || '/placeholder-category.png'} 
                  alt={category.name} 
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-center text-[8px] sm:text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
