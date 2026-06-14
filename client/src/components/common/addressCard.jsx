'uses strict'
import { MapPinned } from "lucide-react";

const AddressCard = ({ 
  type, 
  isDefault, 
  name, 
  address, 
  city, 
  state, 
  pincode, 
  phone, 
  onEdit, 
  onDelete, 
  onSetDefault,
  isSelected // New prop for selection
}) => (
  <div className={`relative rounded-[2.5rem] p-8 border-4 transition-all duration-500 overflow-hidden group 
    ${isSelected ? 'border-[#0f5132] bg-[#f0fdf4] shadow-2xl scale-[1.02]' : 
      isDefault ? 'border-slate-200 bg-[#f8fafc]' : 'border-slate-50 bg-white hover:border-slate-100 hover:shadow-2xl shadow-slate-200/40'}`}>
    
    {(isDefault || isSelected) && (
      <div className="absolute right-0 top-0 rounded-bl-[1.5rem] bg-[#0f5132] px-6 py-2 shadow-2xl z-20">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">
            {isSelected ? "Selected" : "Default"}
          </span>
      </div>
    )}
    
    <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-slate-100/50 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

    <div className="flex items-center gap-4 mb-8">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-all duration-500 
        ${(isDefault || isSelected) ? 'bg-[#0f5132] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#0f5132] group-hover:text-white'}`}>
        <MapPinned className="h-6 w-6" />
      </div>
      <div className="text-left">
        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{type}</h3>
        <p className={`text-[10px] font-black uppercase tracking-widest ${(isDefault || isSelected) ? 'text-[#0f5132]' : 'text-slate-400'}`}>
          {isSelected ? "Delivery Destination" : "Primary Delivery"}
        </p>
      </div>
    </div>

    <div className="space-y-2 relative z-10 text-left">
      <p className="text-base font-black text-slate-900 tracking-tight">{name}</p>
      <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-[220px]">{address}, {city}, {state} - {pincode}</p>
      <div className="flex items-center gap-2 mt-4 text-xs font-black text-[#0f5132]">
          <span className="px-2 py-0.5 rounded bg-[#0f5132]/10">TEL</span>
          {phone}
      </div>
    </div>

    {(onEdit || onDelete || onSetDefault) && (
      <div className="mt-10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
              {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0f5132] hover:text-green-700 transition-colors">Edit</button>}
              {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-700 transition-colors">Delete</button>}
          </div>
          {(!isDefault && onSetDefault) && <button onClick={(e) => { e.stopPropagation(); onSetDefault(); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#0f5132]">Set Default</button>}
      </div>
    )}
  </div>
);
export default AddressCard;