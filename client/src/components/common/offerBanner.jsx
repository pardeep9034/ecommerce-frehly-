import React from 'react'
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OfferBanner = () => {
  return (
    <section className="w-full bg-[#f8fafc] py-12 lg:py-20">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[4rem] bg-[#1f2937] px-8 py-12 sm:px-16 sm:py-16 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] shadow-2xl transition-all duration-500 hover:shadow-black/20">
          {/* Glow effect */}
          <div className="absolute right-0 top-0 h-[30rem] w-[30rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-yellow-400/10 blur-[120px]"></div>
          <div className="absolute left-0 bottom-0 h-[20rem] w-[20rem] -translate-x-1/3 translate-y-1/3 rounded-full bg-[#0f5132]/20 blur-[100px]"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-between gap-12 lg:flex-row">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 backdrop-blur-md border border-yellow-400/20 mb-8">
                <Sparkles className="h-4 w-4 fill-yellow-400" />
                Limited Harvest Offer
              </div>
              <h2 className="text-4xl font-black text-white sm:text-6xl tracking-tighter leading-none mb-6">
                Fresh Organic Harvest <br />
                <span className="text-yellow-400 italic underline decoration-[10px] underline-offset-[10px]">20% Discount</span>
              </h2>
              <p className="mt-10 text-xl text-gray-400 font-bold leading-relaxed">
                Experience the true taste of nature. Our certified organic produce is harvested at peak ripeness and delivered within 24 hours.
              </p>
            </div>
            
            <Link 
              to="/shop" 
              className="flex h-20 items-center justify-center gap-4 rounded-full bg-yellow-400 px-12 text-base font-black text-[#1f2937] transition-all hover:bg-white hover:scale-105 active:scale-95 shadow-2xl shadow-yellow-400/20 group group/btn"
            >
              Start My Health Journey
              <ArrowRight className="h-6 w-6 transition-transform group-hover/btn:translate-x-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
