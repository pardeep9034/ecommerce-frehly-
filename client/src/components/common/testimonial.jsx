import React from 'react'
import { Quote, Star } from 'lucide-react';

export const Testimonial = () => {
    const testimonials = [
        {
            id: 1,
            name: "John Doe",
            role: "Regular Customer",
            feedback: "The quality of organic vegetables is unmatched. I've been ordering for months and the freshness is consistently amazing!",
            rating: 5,
            avatar: "https://i.pravatar.cc/100?u=john",
        },
        {
            id: 2,
            name: "Jane Smith",
            role: "Home Chef",
            feedback: "The variety of exotic fruits and leafy greens helps me explore so many new recipes. Always fresh and delivered on time.",
            rating: 5,
            avatar: "https://i.pravatar.cc/100?u=jane",
        },
        {
            id: 3,
            name: "Alice Johnson",
            role: "Nutritionist",
            feedback: "I highly recommend Freshly to all my clients. Pristine quality organic products delivered with such care and speed.",
            rating: 5,
            avatar: "https://i.pravatar.cc/100?u=alice",
        }
    ];

  return (
    <section className="w-full bg-white py-20 lg:py-32 overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[40rem] h-[40rem] bg-green-50 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-yellow-50 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>
      
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0f5132]/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#0f5132] mb-6">
            <Star className="h-4 w-4 fill-[#0f5132]" />
            Customer Stories
          </div>
          <h2 className="text-4xl font-black text-[#1f2937] sm:text-6xl tracking-tighter leading-none mb-6">
            What Our Community <span className="text-[#16a34a] italic underline decoration-[12px] underline-offset-[12px]">Say</span>
          </h2>
          <p className="mt-10 text-xl text-[#6b7280] font-bold leading-relaxed">
            Join over 50,000 health-conscious individuals who trust Freshly for their daily organic essentials.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="relative flex flex-col rounded-[3.5rem] bg-white p-10 border border-gray-100 shadow-2xl shadow-gray-200/50 transition-all duration-700 hover:-translate-y-3 hover:shadow-green-900/10 group"
            >
              <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-125">
                <Quote className="h-24 w-24 text-[#0f5132]" />
              </div>
              
              <div className="mb-8 flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100"}`} 
                  />
                ))}
              </div>

              <p className="mb-10 flex-1 text-xl font-bold italic leading-relaxed text-[#4b5563]">
                "{testimonial.feedback}"
              </p>

              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#16a34a]/20 rounded-full blur-lg scale-110"></div>
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="relative h-16 w-16 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1f2937] tracking-tight">{testimonial.name}</h3>
                  <p className="text-[10px] font-black text-[#16a34a] uppercase tracking-[0.2em]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
