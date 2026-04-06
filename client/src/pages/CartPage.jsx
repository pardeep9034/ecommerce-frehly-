import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  ChevronRight,
  MapPin,
  CheckCircle2,
  CreditCard,
  History
} from "lucide-react";
import { Link } from "react-router-dom";
import { removeFromCart, updateQuantity } from "@/redux/cartSlice";
import useAddress from "@/hooks/use-address";
import AddressCard from "@/components/common/addressCard";

const CartPage = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const { addresses, isLoading: addressLoading } = useAddress();
  
  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Payment
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Price Calculations
  const subtotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0),
    [cartItems]
  );
  
  const deliveryFee = subtotal > 500 || cartItems.length === 0 ? 0 : 40;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + gst;

  const handleUpdateQuantity = (productId, variantId, newQty) => {
    if (newQty < 1) return;
    dispatch(updateQuantity({ productId, variantId, quantity: newQty }));
  };

  const handleRemoveItem = (productId, variantId) => {
    dispatch(removeFromCart({ productId, variantId }));
  };

  if (cartItems.length === 0 && step === 1) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 rounded-full bg-orange-50 p-10 animate-bounce">
          <ShoppingBag className="h-16 w-16 text-orange-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your cart is feeling organic...ly light!</h2>
        <p className="mt-4 max-w-md text-base font-medium text-slate-500 leading-relaxed">
          Looks like you haven't added any fresh essentials yet. Explore our sustainable products and start your healthy journey today.
        </p>
        <Link 
          to="/shop" 
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0f5132] px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-green-900/30 transition-all hover:scale-105 hover:bg-[#0b4128] active:scale-95"
        >
          Start Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-24 pt-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        
        {/* Stepper */}
        <div className="mb-12 flex items-center justify-center">
          <div className="flex w-full max-w-2xl items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-[#0f5132] -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />

            {[
              { id: 1, label: "My Cart", icon: ShoppingBag },
              { id: 2, label: "Shipping", icon: MapPin },
              { id: 3, label: "Payment", icon: CreditCard }
            ].map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center group">
                <div 
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-500 ${
                    step >= s.id 
                      ? "bg-[#0f5132] border-[#0f5132] text-white shadow-lg shadow-green-900/20" 
                      : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300"
                  }`}
                >
                  {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={`mt-3 text-xs font-black uppercase tracking-widest transition-colors ${
                  step >= s.id ? "text-[#0f5132]" : "text-slate-400"
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Bag <span className="text-slate-400">({cartItems.length})</span></h1>
                  <button onClick={() => {}} className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors">Clear Bag</button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {cartItems.map((item) => (
                    <div 
                      key={`${item.productId}-${item.variantId}`}
                      className="group relative flex gap-4 rounded-[2rem] border border-slate-100 bg-white p-4 transition-all hover:border-[#16a34a]/30 hover:shadow-xl hover:shadow-green-900/5 sm:gap-6 sm:p-6"
                    >
                      {/* Product Image */}
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-50 sm:h-32 sm:w-32">
                        <img 
                          src={item.image || "/placeholder.png"} 
                          alt={item.name} 
                          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col justify-between py-1">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-black text-slate-900 sm:text-lg tracking-tight group-hover:text-[#0f5132] transition-colors text-left">{item.name}</h3>
                            <button 
                              onClick={() => handleRemoveItem(item.productId, item.variantId)}
                              className="rounded-full p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#0f5132]/60 text-left">{item.variantName}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 shadow-inner">
                            <button 
                              onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-900 transition-all hover:bg-white hover:text-[#0f5132] hover:shadow-sm"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-900 transition-all hover:bg-white hover:text-[#0f5132] hover:shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-lg font-black text-slate-900">₹{item.priceSnapshot * item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Delivery Address</h2>
                    <p className="mt-1 text-sm font-bold text-slate-400">Where should we send your fresh items?</p>
                  </div>
                  <button className="flex items-center gap-2 rounded-full bg-[#0f5132] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0b4128] transition-all shadow-xl shadow-green-900/10">
                    <Plus className="h-4 w-4" />
                    New Address
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addressLoading ? (
                    Array(2).fill(0).map((_, i) => (
                      <div key={i} className="h-48 animate-pulse rounded-[2rem] bg-slate-100" />
                    ))
                  ) : addresses?.length > 0 ? (
                    addresses.map(address => (
                      <div 
                        key={address.id} 
                        onClick={() => setSelectedAddress(address)}
                        className={`cursor-pointer transition-all ${selectedAddress?.id === address.id ? "scale-[1.02]" : ""}`}
                      >
                         <AddressCard 
                            type={address.addressType} 
                            isDefault={address.isDefault} 
                            name={address.fullName}
                            address={`${address.addressLine1} ${address.addressLine2 || ''}`}
                            city={address.city}
                            state={address.state}
                            pincode={address.pincode}
                            phone={address.phone}
                            isSelected={selectedAddress?.id === address.id}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center rounded-[2.5rem] border-4 border-dashed border-slate-100">
                      <p className="text-slate-400 font-bold">No saved addresses found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 p-8 rounded-[2.5rem] border border-slate-100 bg-white text-center">
                 <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                    <History className="h-10 w-10 text-[#0f5132] animate-spin-slow" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Integrating Payment Gateway...</h2>
                 <p className="mt-4 text-slate-500 font-medium max-w-sm mx-auto">We're setting up a secure payment environment for you. Redirecting to checkout shortly. </p>
                 <div className="mt-8 flex justify-center gap-4">
                    <div className="h-8 w-12 rounded bg-slate-100 animate-pulse" />
                    <div className="h-8 w-12 rounded bg-slate-100 animate-pulse" />
                    <div className="h-8 w-12 rounded bg-slate-100 animate-pulse" />
                 </div>
              </div>
            )}

          </div>

          {/* Right Sidebar - Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
              <div className="p-8">
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8 text-left">Order Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Bag Subtotal</span>
                    <span className="text-slate-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? "text-green-600" : "text-slate-900"}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Handling GST (5%)</span>
                    <span className="text-slate-900">₹{gst}</span>
                  </div>
                </div>

                {deliveryFee > 0 && (
                   <div className="mt-6 rounded-2xl bg-orange-50 p-4 border border-orange-100 text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
                         <Truck className="h-3 w-3" />
                         Pro Tip
                      </p>
                      <p className="mt-1 text-xs font-bold text-orange-700 leading-tight">
                        Add <span className="font-black underline">₹{500 - subtotal}</span> more for FREE delivery.
                      </p>
                   </div>
                )}

                <div className="mt-8 border-t border-slate-100 pt-8">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900">Order Total</span>
                    <span className="text-2xl font-black text-[#0f5132]">₹{total}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {step === 1 && (
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full flex h-14 items-center justify-center gap-3 rounded-full bg-[#0f5132] px-8 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-green-900/20 transition-all hover:bg-[#0b4128] hover:scale-[1.02] active:scale-95 group"
                    >
                      Checkout Now
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                  
                  {step === 2 && (
                    <button 
                      disabled={!selectedAddress}
                      onClick={() => setStep(3)}
                      className="w-full flex h-14 items-center justify-center gap-3 rounded-full bg-[#0f5132] px-8 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-green-900/20 transition-all hover:bg-[#0b4128] hover:scale-[1.02] active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Proceed to Payment
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}

                  <div className="flex items-center justify-center gap-6 mt-6">
                    <ShieldCheck className="h-5 w-5 text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400 text-center leading-tight">
                      Secure encrypted checkout with 256-bit SSL protection
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="mt-6 w-full text-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Go back to {step === 2 ? "Bag" : "Shipping"}
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CartPage;