import React, { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  const contactInfo = [
    {
      title: "Our Office",
      details: ["12th Floor, Green Tech Park", "Bengaluru, Karnataka 560001"],
      icon: MapPin,
    },
    {
      title: "Contact Info",
      details: ["+91 98765 43210", "hello@freshly.organic"],
      icon: Phone,
    },
    {
      title: "Business Hours",
      details: ["Mon - Sat: 9:00 AM - 8:00 PM", "Sun: 10:00 AM - 4:00 PM"],
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <section className="bg-[#0f5132] py-20 text-center text-white">
        <div className="mx-auto max-w-7xl px-4">
           <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#fbbf24]">
             Contact Us
           </span>
           <h1 className="mt-4 text-4xl font-black sm:text-5xl">We'd Love to <span className="text-[#fbbf24]">Hear From You</span></h1>
           <p className="mt-6 mx-auto max-w-2xl text-lg text-white/70">
             Have a question about our products, an order, or just want to say hi? 
             Our team is always here to help you live a fresher life.
           </p>
        </div>
      </section>

      <section className="mx-auto -mt-12 max-w-7xl px-4 pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Contact Details cards */}
          <div className="space-y-6">
            {contactInfo.map((info, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f5132]/5 text-[#0f5132]">
                  <info.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{info.title}</h3>
                <div className="mt-3 space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-500 font-medium">{detail}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Social Connect */}
            <div className="rounded-2xl bg-[#0f5132] p-8 text-white shadow-xl shadow-[#0f5132]/20">
              <h3 className="text-xl font-bold">Connect With Us</h3>
              <p className="mt-2 text-sm text-white/70">Follow our handles for fresh updates and organic recipes.</p>
              <div className="mt-6 flex gap-4">
                {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-[#fbbf24] hover:text-[#0f5132]">
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="h-full rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-12">
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                    <Send className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Message Sent Successfully!</h2>
                  <p className="mt-4 text-gray-500">
                    Thank you for reaching out. Our team will get back to you within 
                    24-48 business hours.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 font-bold text-[#0f5132] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                    <h2 className="text-3xl font-black text-gray-900">Send us a Message</h2>
                    <p className="mt-2 text-gray-500">Fill out the form below and we'll reply as soon as possible.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Full Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="John Doe"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Email Address</label>
                        <input 
                          required
                          type="email" 
                          placeholder="john@example.com"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Subject</label>
                      <input 
                        required
                        type="text" 
                        placeholder="How can we help?"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Message</label>
                      <textarea 
                        required
                        rows="5"
                        placeholder="Write your message here..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/5"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f5132] py-4 text-base font-bold text-white shadow-lg shadow-[#0f5132]/20 transition-all hover:scale-[1.02] hover:bg-[#0b4128] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 h-[400px] relative">
           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <MapPin className="h-12 w-12 mb-4" />
              <p className="font-bold">Google Maps Placeholder</p>
              <p className="text-sm">Green Tech Park, Bengaluru</p>
           </div>
           {/* In a real scenario, an iframe or map component would go here */}
        </div>
      </section>
    </div>
  );
};

export default Contact;
