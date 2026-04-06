import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile } from '../apis/authApi';
import { getUserAddresses, deleteAddress, setDefaultAddress } from '../apis/userApi';
import AddressFormModal from '../components/profile/AddressFormModal';
import useAddress from '@/hooks/use-address';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Edit2, 
  CheckCircle2, 
  MapPinned,
  ShieldCheck,
  CreditCard,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();
  const {addresses, isLoading: isAddressesLoading} = useAddress();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await getProfile();
      return res.data.data;
    },
    enabled: !!token,
  });

  // const { data: addresses, isLoading: isAddressesLoading } = useQuery({
  //   queryKey: ["addresses", profile?.id],
  //   queryFn: async () => {
  //     const res = await getUserAddresses(profile.id);
  //     return res.data;
  //   },
  //   enabled: !!profile?.id,
  // });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => queryClient.invalidateQueries(["addresses", profile?.id])
  });

  const setDefaultMutation = useMutation({
    mutationFn: (addressId) => setDefaultAddress(addressId, profile.id),
    onSuccess: () => queryClient.invalidateQueries(["addresses", profile?.id])
  });

  const openAddModal = () => {
    setCurrentAddress(null);
    setIsAddressModalOpen(true);
  };

  const openEditModal = (address) => {
    setCurrentAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'address', label: 'My Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, path: '/orders' },
    { id: 'security', label: 'Account Security', icon: ShieldCheck },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0f5132] border-t-transparent shadow-lg"></div>
          <p className="text-sm font-black text-[#0f5132] uppercase tracking-[0.2em] animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-12 lg:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 sticky lg:top-32">
            <div className="overflow-hidden rounded-[3rem] bg-white shadow-2xl shadow-slate-200/60 border border-white">
              <div className="relative bg-[#0f5132] p-10 text-center text-white overflow-hidden">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-yellow-400/10 blur-2xl"></div>
                
                <div className="relative mx-auto mb-6 h-28 w-28">
                  <div className="flex h-full w-full items-center justify-center rounded-[2.5rem] bg-white/10 text-4xl font-black backdrop-blur-xl border-2 border-white/20 shadow-2xl">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </div>
                  <button className="absolute -bottom-2 -right-2 rounded-2xl bg-yellow-400 p-3 text-[#0f5132] shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-[#0f5132]">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="text-2xl font-black tracking-tighter leading-none mb-1">{profile?.first_name} {profile?.last_name}</h2>
                <p className="text-[10px] font-black text-green-100/60 uppercase tracking-[0.3em] mt-2">Verified Member</p>
              </div>

              <nav className="p-4 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                        if(tab.path) navigate(tab.path);
                        else setActiveTab(tab.id);
                    }}
                    className={`group flex w-full items-center gap-4 rounded-[1.5rem] px-6 py-4 text-sm font-black transition-all ${
                      activeTab === tab.id 
                        ? "bg-[#0f5132] text-white shadow-2xl shadow-green-900/20" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#0f5132]"
                    }`}
                  >
                    <tab.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? "text-yellow-400" : "text-slate-400 group-hover:text-[#0f5132]"}`} />
                    {tab.label}
                  </button>
                ))}
                
                <div className="my-6 h-px bg-slate-100 mx-4"></div>
                
                <button 
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-4 rounded-[1.5rem] px-6 py-5 text-sm font-black text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                >
                  <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  Logout Account
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 w-full">
            <div className="rounded-[3.5rem] bg-white p-8 lg:p-16 shadow-2xl shadow-slate-200/60 border border-white min-h-[700px]">
              
              {activeTab === 'personal' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#0f5132] mb-4">
                        <User className="h-3.5 w-3.5 fill-[#0f5132]" />
                        Account Details
                      </div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Personal Information</h2>
                      <p className="text-base font-bold text-slate-400 mt-3 leading-relaxed max-w-md">Update your profile details and manage how you appear on the platform.</p>
                    </div>
                    <button className="rounded-full bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0f5132] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                      Edit Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <InfoCard label="First Name" value={profile?.first_name || "N/A"} />
                    <InfoCard label="Last Name" value={profile?.last_name || "N/A"} />
                    <InfoCard label="Email Address" value={profile?.email || "N/A"} isVerified />
                    <InfoCard label="Phone Number" value={profile?.phone || "N/A"} />
                  </div>

                  <div className="mt-16 rounded-[2.5rem] bg-slate-50 p-10 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-slate-200/20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-md">
                            <h3 className="text-xl font-black text-slate-900 mb-2">Password & Security</h3>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed">It's a good idea to use a strong password that you don't use elsewhere.</p>
                        </div>
                        <button className="rounded-2xl bg-white border border-slate-200 px-8 py-4 text-xs font-black text-slate-800 hover:border-[#0f5132] hover:text-[#0f5132] transition-all shadow-sm">
                            Change Password
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 mb-4">
                        <MapPin className="h-3.5 w-3.5 fill-orange-600" />
                        Saved Locations
                      </div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">My Addresses</h2>
                      <p className="text-base font-bold text-slate-400 mt-3 leading-relaxed max-w-md">Manage your delivery locations for faster checkout experience.</p>
                    </div>
                    <button 
                      onClick={openAddModal}
                      className="flex items-center gap-2 rounded-full bg-[#0f5132] px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0b4128] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-green-900/30"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Address
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {addresses?.map(address => (
                      <AddressCard 
                        key={address.id}
                        type={address.addressType} 
                        isDefault={address.isDefault} 
                        name={address.fullName}
                        address={`${address.addressLine1} ${address.addressLine2 || ''}`}
                        city={address.city}
                        state={address.state}
                        pincode={address.pincode}
                        phone={address.phone}
                        onEdit={() => openEditModal(address)}
                        onDelete={() => deleteMutation.mutate(address.id)}
                        onSetDefault={() => setDefaultMutation.mutate(address.id)}
                      />
                    ))}
                    {!isAddressesLoading && addresses?.length === 0 && (
                      <div className="col-span-1 md:col-span-2 text-center py-20 border-4 border-dashed border-slate-200 rounded-[2.5rem]">
                        <p className="text-slate-400 font-bold">No saved addresses found. Add one to get started!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {['security', 'payment'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in zoom-in duration-500">
                  <div className="mb-8 rounded-full bg-slate-50 p-12 text-slate-200">
                    <Settings className="h-20 w-20 animate-[spin_10s_linear_infinite]" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab} Section</h3>
                  <p className="mt-4 max-w-xs text-slate-400 font-bold leading-relaxed">This module is currently under development. Stay tuned for new features!</p>
                  <button 
                    onClick={() => setActiveTab('personal')}
                    className="mt-10 text-xs font-black uppercase tracking-widest text-[#0f5132] underline decoration-2 underline-offset-8 decoration-yellow-400"
                  >
                    Back to Profile
                  </button>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      <AddressFormModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialData={currentAddress}
        userId={profile?.id}
      />
    </div>
  );
};

const InfoCard = ({ label, value, isVerified }) => (
  <div className="space-y-3 group">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 transition-colors group-hover:text-[#0f5132]">{label}</label>
    <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-50 px-8 py-5 border border-slate-100 transition-all hover:bg-white hover:border-[#0f5132]/30 hover:shadow-xl hover:shadow-slate-200/40">
      <span className="text-sm font-black text-slate-900">{value}</span>
      {isVerified && (
        <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span className="text-[8px] font-black uppercase tracking-wider text-green-600">Verified</span>
        </div>
      )}
    </div>
  </div>
);

const AddressCard = ({ type, isDefault, name, address, city, state, pincode, phone, onEdit, onDelete, onSetDefault }) => (
  <div className={`relative rounded-[2.5rem] p-8 border-4 transition-all duration-500 overflow-hidden group ${isDefault ? 'border-[#0f5132] bg-[#f0fdf4]' : 'border-slate-50 bg-white hover:border-slate-100 hover:shadow-2xl shadow-slate-200/40'}`}>
    {isDefault && (
      <div className="absolute right-0 top-0 rounded-bl-[1.5rem] bg-[#0f5132] px-6 py-2 shadow-2xl">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Default</span>
      </div>
    )}
    
    <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-slate-100/50 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

    <div className="flex items-center gap-4 mb-8">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-all duration-500 ${isDefault ? 'bg-[#0f5132] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#0f5132] group-hover:text-white'}`}>
        <MapPinned className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{type}</h3>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isDefault ? 'text-[#0f5132]' : 'text-slate-400'}`}>Primary Delivery</p>
      </div>
    </div>

    <div className="space-y-2 relative z-10">
      <p className="text-base font-black text-slate-900 tracking-tight">{name}</p>
      <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-[220px]">{address}, {city}, {state} - {pincode}</p>
      <div className="flex items-center gap-2 mt-4 text-xs font-black text-[#0f5132]">
          <span className="px-2 py-0.5 rounded bg-[#0f5132]/10">TEL</span>
          {phone}
      </div>
    </div>

    <div className="mt-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
            <button onClick={onEdit} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0f5132] hover:text-green-700 transition-colors">Edit</button>
            <button onClick={onDelete} className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-700 transition-colors">Delete</button>
        </div>
        {!isDefault && <button onClick={onSetDefault} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#0f5132]">Set Default</button>}
    </div>
  </div>
);

export default Profile;
