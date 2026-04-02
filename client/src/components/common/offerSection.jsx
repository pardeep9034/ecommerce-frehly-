import React from "react";
import { ArrowRight, Sparkles, Percent, Timer } from "lucide-react";
import { Link } from "react-router-dom";

export const OfferSection = () => {
  const offers = [
    {
      id: 1,
      tag: "Limited Time",
      title: "Best Deals",
      subtitle: "Sale of the Month",
      info: "Starting 25 Jul - 31 Jul",
      icon: <Timer className="h-5 w-5" />,
      gradient: "from-[#0f5132] to-[#16a34a]",
      textColor: "text-white"
    },
    {
      id: 2,
      tag: "New Users",
      title: "Welcome Offer",
      subtitle: "50% Off",
      info: "On your first order",
      icon: <Sparkles className="h-5 w-5" />,
      gradient: "from-orange-500 to-amber-400",
      textColor: "text-white"
    },
    {
      id: 3,
      tag: "Special",
      title: "Summer Sale",
      subtitle: "100% Fresh Fruit",
      info: "Up to 15% Off",
      icon: <Percent className="h-5 w-5" />,
      gradient: "from-blue-600 to-cyan-400",
      textColor: "text-white"
    },
  ];

  return (
    <section className="w-full py-8 lg:py-20">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {offers.map((offer) => (
            <div 
              key={offer.id} 
              className={`relative group overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br ${offer.gradient} p-5 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[180px] sm:min-h-[280px] shadow-2xl shadow-green-900/10 hover:shadow-green-900/20 hover:scale-[1.02] transition-all duration-500 ${offer.id === 3 ? "col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="absolute -right-10 -top-10 h-20 sm:h-40 w-20 sm:w-40 rounded-full bg-white/10 blur-2xl sm:blur-3xl group-hover:bg-white/20 transition-colors"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md mb-3 sm:mb-6 border border-white/10">
                  {React.cloneElement(offer.icon, { className: "h-3 w-3 sm:h-5 sm:w-5" })}
                  {offer.tag}
                </div>
                <h3 className="text-[8px] sm:text-base font-bold text-white/70 uppercase tracking-widest mb-1">{offer.title}</h3>
                <h2 className="text-md sm:text-4xl font-black text-white leading-tight mb-2 sm:mb-4 uppercase italic tracking-tighter">{offer.subtitle}</h2>
                <p className="text-[8px] sm:text-sm font-black text-white/90 tracking-tight line-clamp-1">{offer.info}</p>
              </div>

              <Link 
                to="/shop" 
                className="relative z-10 inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-3 py-1 sm:px-8 sm:py-3.5 text-[8px] sm:text-[10px] font-black text-[#0f5132] hover:bg-yellow-300 transition-all group/link shadow-xl"
              >
                Explore
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
