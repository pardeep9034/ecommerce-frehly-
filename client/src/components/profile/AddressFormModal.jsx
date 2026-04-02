import React, { useState, useEffect } from "react";
import { X, MapPin, Building, Globe, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAddress, updateAddress } from "../../apis/userApi";

const AddressFormModal = ({ isOpen, onClose, initialData, userId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    state: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    addressType: "HOME",
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        addressType: initialData.addressType || "HOME",
      });
    } else {
      setFormData({
        fullName: "",
        phone: "",
        pincode: "",
        state: "",
        city: "",
        addressLine1: "",
        addressLine2: "",
        landmark: "",
        addressType: "HOME",
        isDefault: false,
      });
    }
  }, [initialData, isOpen]);

  const mutation = useMutation({
    mutationFn: (data) =>
      initialData
        ? updateAddress(initialData.id, data)
        : createAddress({ ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["addresses", userId]);
      onClose();
    },
    onError: (error) => {
      console.error("Address Error:", error);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-[#0f5132] px-8 py-6 text-white overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight mb-1">
                    {initialData ? "Edit Address" : "Add New Address"}
                    </h2>
                    <p className="text-xs font-bold text-green-100/70 tracking-wider uppercase">
                    Provide accurate details for faster delivery
                    </p>
                </div>
                <button 
                    onClick={onClose}
                    className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-8">
          <form id="addressForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                    <input
                        required
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                        placeholder="John Doe"
                    />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mobile Number</label>
                    <input
                        required
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                        placeholder="10-digit mobile number"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pincode */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Pincode</label>
                    <input
                        required
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                        placeholder="e.g. 560001"
                    />
                </div>
                
                {/* City */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">City</label>
                    <input
                        required
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                        placeholder="City / District"
                    />
                </div>

                {/* State */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">State</label>
                    <input
                        required
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                        placeholder="State"
                    />
                </div>
            </div>

            {/* Address Line 1 */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Address Line 1 (House No, Building)</label>
                <input
                    required
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                    placeholder="Flat, House no., Building, Company, Apartment"
                />
            </div>

            {/* Address Line 2 */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Address Line 2 (Area, Street)</label>
                <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                    placeholder="Area, Street, Sector, Village"
                />
            </div>

            {/* Landmark */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Landmark (Optional)</label>
                <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all focus:border-[#0f5132] focus:bg-white focus:ring-4 focus:ring-[#0f5132]/10"
                    placeholder="E.g. near Apollo Hospital"
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between pt-4 pb-2">
                {/* Address Type */}
                <div className="flex gap-4">
                    {["HOME", "WORK", "OTHER"].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer group">
                            <div className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${formData.addressType === type ? 'border-[#0f5132]' : 'border-slate-300 group-hover:border-[#0f5132]'}`}>
                                {formData.addressType === type && <div className="h-2.5 w-2.5 rounded-full bg-[#0f5132]" />}
                            </div>
                            <input 
                                type="radio" 
                                name="addressType" 
                                value={type} 
                                className="hidden" 
                                onChange={handleChange} 
                            />
                            <span className={`text-xs font-black uppercase tracking-wider ${formData.addressType === type ? 'text-[#0f5132]' : 'text-slate-500'}`}>{type}</span>
                        </label>
                    ))}
                </div>

                {/* Make Default */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`flex h-6 w-11 items-center rounded-full transition-colors ${formData.isDefault ? 'bg-[#0f5132]' : 'bg-slate-200'}`}>
                        <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.isDefault ? 'translate-x-5' : 'translate-x-[2px]'}`} />
                    </div>
                    <input
                        type="checkbox"
                        name="isDefault"
                        checked={formData.isDefault}
                        onChange={handleChange}
                        className="hidden"
                    />
                    <span className="text-xs font-black text-slate-700 tracking-wide">Set as default</span>
                </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex items-center justify-end gap-4">
            <button
                type="button"
                onClick={onClose}
                className="rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"
                disabled={mutation.isPending}
            >
                Cancel
            </button>
            <button
                form="addressForm"
                type="submit"
                disabled={mutation.isPending}
                className="rounded-2xl bg-[#0f5132] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#0b4128] hover:shadow-xl hover:shadow-green-900/20 active:scale-95 transition-all outline-none"
            >
                {mutation.isPending ? "Saving..." : "Save Address"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default AddressFormModal;
