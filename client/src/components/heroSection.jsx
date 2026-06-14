import React from "react";
import { ArrowRight, ShoppingBag, Zap, Award } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="w-full  sm:py-2 lg:py-5">
      <div className="mx-auto max-w-screen-2xl px-2 sm:px-4 lg:px-4">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-2">
          
          {/* Main Hero Card */}
          <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-[#0f5132] to-[#16a34a] p-4 sm:p-8 lg:p-8 lg:col-span-2 min-h-[150px] sm:min-h-[350px] lg:min-h-[450px] flex flex-col justify-center shadow-2xl shadow-green-900/20 transition-all duration-500 hover:shadow-green-900/30">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            
            <div className="relative z-10 max-w-l mb-2 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[6px] sm:text-xs font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/20 mb-4 sm:mb-8 motion-safe:animate-bounce">
                <Zap className="h-2 w-2 sm:h-4 sm:w-4 text-yellow-300 fill-yellow-300" />
                Special Offer Live
              </div>
              
              <h1 className="text-1xl font-black leading-[1.1] text-white sm:text-6xl lg:text-7xl mb-4 sm:mb-8 tracking-tighter">
                Fresh & Healthy <br />
                <span className="text-yellow-300 italic underline decoration-4 underline-offset-4 sm:decoration-8 sm:underline-offset-8">Organic</span> Produce
              </h1>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-10">
                <div className="flex flex-col border-l-2 sm:border-l-4 border-yellow-300 pl-4 sm:pl-6">
                  <p className="text-sm sm:text-2xl font-black text-white uppercase tracking-tighter">Save Up TO 30%</p>
                  <p className="text-[8px] sm:text-sm text-green-100 font-bold opacity-80 line-clamp-1">Free express shipping on all orders</p>
                </div>
              </div>
  
              <Link 
                to="/shop" 
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 sm:px-10 sm:py-5 text-xs sm:text-sm font-black text-[#0f5132] shadow-2xl transition-all hover:scale-105 hover:bg-yellow-300 active:scale-95 group/btn"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
  
            {/* Large Hero Image - Floating effect */}
            <div className="absolute -bottom-6 -right-8 lg:-right-4 w-[50%] lg:w-[50%] h-auto hidden sm:block select-none pointer-events-none">
              <img 
                src="HeroImage.png" 
                alt="Fresh Food Basket" 
                className="h-full w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-1000"
              />
            </div>
          </div>
  
          {/* Side Cards */}
          <div className="grid grid-cols-1 gap-3 lg:flex lg:flex-col lg:justify-between h-full">
            
            {/* Offer 1 */}
            <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-orange-500 to-amber-400 p-5 sm:p-8 lg:p-10 flex flex-col justify-between shadow-xl shadow-orange-500/20 min-h-[120px] sm:min-h-[250px] transition-all duration-500 hover:scale-[1.03]">
               <div className="absolute -top-10 -right-10 h-20 sm:h-40 w-20 sm:w-40 rounded-full bg-white/10 blur-2xl sm:blur-3xl group-hover:bg-white/20 transition-colors"></div>
               
               <div className="relative z-10">
                  <span className="text-[6px] sm:text-[10px] font-black uppercase tracking-widest text-white/90 bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">Summer Sale</span>
                  <h2 className="mt-2 text-[10px] sm:text-4xl lg:text-5xl font-black text-white italic tracking-tighter leading-none">75% OFF</h2>
                  <p className="mt-1 text-[6px] sm:text-base font-black text-orange-50/90 tracking-tight line-clamp-1">Fresh Fruits</p>
               </div>
  
               <Link 
                to="/shop" 
                className="relative z-10 inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-2 py-1 sm:px-6 sm:py-2.5 text-[8px] sm:text-xs font-black text-white backdrop-blur-md border border-white/20 hover:bg-white hover:text-orange-600 transition-all group/link"
               >
                  Shop
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/link:translate-x-1" />
               </Link>
            </div>
  
            {/* Offer 2 */}
            <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-[#1f2937] p-5 sm:p-8 lg:p-10 flex flex-col justify-between shadow-xl min-h-[120px] sm:min-h-[250px] bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] transition-all duration-500 hover:scale-[1.03]">
               <div className="absolute top-4 right-4 sm:top-6 sm:right-6 group-hover:rotate-45 transition-transform duration-700">
                  <Award className="h-4 w-4 sm:h-10 sm:w-10 text-yellow-400 drop-shadow-lg" />
               </div>
  
               <div className="relative z-10 text-white">
                  <span className="text-[6px] sm:text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">Best Choice</span>
                  <h2 className="mt-2 text-[10px] sm:text-3xl font-black leading-tight tracking-tighter">Premium Selection</h2>
               </div>
  
               <Link 
                to="/shop" 
                className="relative z-10 inline-flex items-center gap-1.5 self-start rounded-full bg-yellow-400/20 px-2 py-1 sm:px-6 sm:py-2.5 text-[8px] sm:text-xs font-black text-yellow-400 backdrop-blur-md border border-yellow-400/20 hover:bg-yellow-400 hover:text-[#1f2937] transition-all group/link"
               >
                  Explore
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/link:translate-x-1" />
               </Link>
            </div>
  
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
