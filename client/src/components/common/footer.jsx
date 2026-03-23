import React from "react";
import { Link } from "react-router-dom";
import { 
  Leaf, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  ShieldCheck,
  Truck,
  RotateCcw
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4">
        
        {/* Features / Trust Bar */}
        <div className="mb-16 grid grid-cols-1 gap-8 border-b border-gray-100 pb-16 md:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f5132]/5 text-[#0f5132]">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Zero Emission Delivery</h4>
              <p className="text-sm text-gray-500">Eco-friendly electric fleet</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-center md:justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f5132]/5 text-[#0f5132]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Certified Organic</h4>
              <p className="text-sm text-gray-500">100% Pesticide free produce</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right md:justify-end">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f5132]/5 text-[#0f5132]">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Easy Returns</h4>
              <p className="text-sm text-gray-500">No questions asked policy</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          
          {/* Logo & About */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-2xl font-black text-[#0f5132] uppercase tracking-tighter">
              <Leaf className="h-8 w-8 fill-[#0f5132]" />
              freshly
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-gray-500">
              India's most trusted organic food market. We deliver fresh, 
              chemical-free produce directly from farms to your doorstep, 
              ensuring health for you and the planet.
            </p>
            <div className="mt-8 flex gap-4">
              {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 text-gray-400 transition-colors hover:border-[#0f5132] hover:text-[#0f5132]">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-6 font-bold text-gray-900 uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-4">
              {['Home', 'Shop', 'About', 'Contact', 'Orders'].map((item) => (
                <li key={item}>
                  <Link 
                    to={item === 'Home' ? '/' : item === 'Orders' ? '/orders' : `/${item.toLowerCase().replace(' ', '')}`} 
                    className="text-sm font-medium text-gray-500 transition-colors hover:text-[#0f5132]"
                  >
                    {item === 'Orders' ? 'My Orders' : item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 className="mb-6 font-bold text-gray-900 uppercase tracking-widest text-xs">Policies</h4>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms of Service', 'Shipping Policy', 'Refund Policy'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm font-medium text-gray-500 transition-colors hover:text-[#0f5132]">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="mb-6 font-bold text-gray-900 uppercase tracking-widest text-xs">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-gray-500">
                <MapPin className="h-5 w-5 flex-shrink-0 text-[#0f5132]" />
                <span>12th Floor, Green Tech Park, Bengaluru, KA 560001</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-500">
                <Phone className="h-5 w-5 flex-shrink-0 text-[#0f5132]" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-500">
                <Mail className="h-5 w-5 flex-shrink-0 text-[#0f5132]" />
                <span>hello@freshly.organic</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-gray-100 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            © {currentYear} Freshly Retail Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            <p className="text-xs font-bold text-gray-400">MADE WITH 💚 IN INDIA</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
