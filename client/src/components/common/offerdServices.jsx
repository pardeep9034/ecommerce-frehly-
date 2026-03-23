import React from 'react';
import { Truck, ShieldCheck, Headset, Gift } from 'lucide-react';

const OfferedServices = () => {
  const services = [
    {
      icon: <Truck className="h-8 w-8 text-[#0f5132]" />,
      title: 'Free Shipping',
      description: 'Free delivery on orders above ₹499'
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-[#0f5132]" />,
      title: 'Money Back Guarantee',
      description: '100% refund within 7 days'
    },
    {
      icon: <Headset className="h-8 w-8 text-[#0f5132]" />,
      title: '24/7 Support',
      description: 'Always here to help you'
    },
    {
      icon: <Gift className="h-8 w-8 text-[#0f5132]" />,
      title: 'Exclusive Offers',
      description: 'Special deals for members'
    },
  ];

  return (
    <section className="w-full py-2 lg:py-4">
      <div className="mx-auto max-w-screen-2xl px-1 sm:px-2 lg:px-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="group flex flex-col items-center text-center gap-2 p-2 sm:p-4 rounded-2xl sm:rounded-[2rem] bg-white border border-gray-100 transition-all duration-300 hover:border-[#16a34a] hover:shadow-2xl hover:shadow-green-900/5 transition-all"
            >
              <div className="flex shrink-0 h-10 w-6 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-green-50 text-[#0f5132] group-hover:bg-[#0f5132] group-hover:text-white transition-all duration-300">
                {React.cloneElement(service.icon, { className: "h-2 w-2 sm:h-4 sm:w-4" })}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#1f2937] tracking-tight line-clamp-1">{service.title}</h3>
                <p className="mt-1 text-[8px] sm:text-xs font-bold text-[#6b7280] leading-tight line-clamp-1">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferedServices;