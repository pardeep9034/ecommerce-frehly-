import React from "react";
import { 
  Leaf, 
  Target, 
  Users, 
  Award, 
  Truck, 
  ShieldCheck, 
  Heart,
  Globe
} from "lucide-react";

const About = () => {
  const stats = [
    { label: "Happy Customers", value: "50K+", icon: Users },
    { label: "Organic Products", value: "200+", icon: Leaf },
    { label: "Farmers Network", value: "100+", icon: Globe },
    { label: "Quality Awards", value: "15", icon: Award },
  ];

  const values = [
    {
      title: "100% Organic",
      description: "We partner exclusively with certified organic farms to ensure no synthetic pesticides touch your food.",
      icon: Leaf,
    },
    {
      title: "Fair Trade",
      description: "Our farmers receive fair compensation, supporting sustainable agricultural communities across the country.",
      icon: ShieldCheck,
    },
    {
      title: "Eco-Friendly",
      description: "From plastic-free packaging to carbon-neutral delivery, we care for the planet at every step.",
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden bg-[#0f5132]">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop" 
            alt="Organic Farm" 
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-bold tracking-widest text-[#fbbf24] uppercase">
            Our Journey
          </span>
          <h1 className="text-4xl font-black text-white sm:text-6xl tracking-tight">
            Rooted in <span className="text-[#fbbf24]">Nature</span>, <br />Dedicated to <span className="text-[#fbbf24]">Purity</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80 leading-relaxed font-medium">
            Freshly started with a simple belief: Everyone deserves access to real, 
            chemical-free food that’s good for the body and the earth.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
              <stat.icon className="h-8 w-8 text-[#0f5132] mb-3" />
              <span className="text-3xl font-black text-gray-900">{stat.value}</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-64 w-64 rounded-full bg-[#0f5132]/5 blur-3xl" />
              <img 
                src="https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=800&auto=format&fit=crop" 
                alt="Fresh Harvest" 
                className="relative z-10 rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-8 -right-8 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#ea580c] p-6 text-white shadow-xl">
                 <Target className="h-8 w-8 mb-2" />
                 <span className="text-2xl font-black">2020</span>
                 <span className="text-xs font-bold uppercase opacity-80">Established</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                Our Mission is to <br />
                <span className="text-[#0f5132]">Bridge the Gap</span> Between <br />
                Farm and Table.
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Conventional food supply chains are broken. We're rebuilding them by 
                empowering small-scale organic farmers and delivering their harvest 
                directly to your doorstep within 24 hours.
              </p>
              
              <div className="mt-10 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f5132]/10 text-[#0f5132]">
                    <Leaf className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Purity First</h3>
                    <p className="text-gray-500">Every product is tested for residues and quality before it enters our supply chain.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f5132]/10 text-[#0f5132]">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Community Focused</h3>
                    <p className="text-gray-500">We invest 5% of our profits into local irrigation and soil-health programs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">What We Stand For</h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            Our values guide every decision we make, from the farmers we choose to 
            the way we package our produce.
          </p>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map((value, i) => (
              <div key={i} className="group rounded-3xl bg-white p-10 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl">
                 <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f5132]/5 text-[#0f5132] transition-colors group-hover:bg-[#0f5132] group-hover:text-white">
                   <value.icon className="h-8 w-8" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">{value.title}</h3>
                 <p className="mt-4 text-gray-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2">
            <Award className="h-10 w-10" />
            <span className="text-xl font-black tracking-tighter">GLOBAL G.A.P.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-10 w-10" />
            <span className="text-xl font-black tracking-tighter">FSSAI CERTIFIED</span>
          </div>
          <p className="text-sm font-bold text-gray-400">ORGANIC CERTIFIED BY NPOP INDIA</p>
        </div>
      </section>
    </div>
  );
};

export default About;
