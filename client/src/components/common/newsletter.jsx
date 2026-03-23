import React, { useState } from 'react';
import { Send, Bell, CheckCircle2 } from 'lucide-react';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <section className="w-full bg-[#f8fafc] py-16 lg:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[4rem] bg-[#0f5132] px-8 py-12 sm:px-16 sm:py-24 lg:flex lg:items-center lg:justify-between shadow-2xl shadow-green-900/40 transition-all duration-500 hover:shadow-green-900/50">
          {/* Background Decorative Elements */}
          <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md border border-white/20 mb-8">
              <Bell className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              Stay in the Loop
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-white sm:text-6xl leading-[0.95] mb-6">
              Join our Community <br />
              & get <span className="text-yellow-300 italic underline decoration-8 underline-offset-8">20% Off</span>
            </h2>
            <p className="mt-8 text-lg font-bold text-green-100/80 leading-relaxed max-w-lg">
              Subscribe for exclusive recipes, seasonal harvests, and organic living tips delivered to your inbox weekly.
            </p>
          </div>

          <div className="relative z-10 mt-12 lg:mt-0 lg:ml-12 w-full max-w-md">
            {subscribed ? (
              <div className="flex items-center gap-4 rounded-[2.5rem] bg-white p-10 text-[#0f5132] animate-in zoom-in duration-500 shadow-2xl">
                 <CheckCircle2 className="h-12 w-12 text-green-500 shrink-0" />
                 <div>
                    <h3 className="text-2xl font-black tracking-tight">You're Subscribed!</h3>
                    <p className="text-sm font-bold opacity-70">Watch your inbox for your exclusive code.</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:bg-white sm:rounded-full sm:p-2 sm:shadow-2xl">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@yourbrand.com"
                  className="w-full rounded-full border-none bg-white px-8 py-5 text-sm font-black text-[#1f2937] placeholder:text-gray-400 focus:ring-0 sm:bg-transparent sm:py-3"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#0f5132] px-10 py-5 text-sm font-black text-white transition-all hover:bg-yellow-400 hover:text-[#0f5132] hover:scale-105 active:scale-95 shadow-xl sm:py-4 sm:px-12"
                >
                  Join Now
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            <p className="mt-6 text-xs font-bold text-green-100/40 text-center lg:text-left tracking-widest uppercase">
              NO SPAM. JUST PURE ORGANIC GOODNESS.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
