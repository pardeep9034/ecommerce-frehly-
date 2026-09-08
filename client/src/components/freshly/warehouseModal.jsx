import { useEffect, useState } from "react";
import { X } from "lucide-react";
import useDeliveryZone from "@/hooks/use-deliveryZone";
import SearchableSelector from "@/components/common/searchableSelect";
const EMPTY_WAREHOUSES = {

    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zone_id: "",
    latitude: "",
    longitude: "",
    contact_person: "",
    contact_phone: "",
    is_active: "",
};

const WarehouseModal = ({ open, onClose, warehouse, onSave }) => {
    const [form, setForm] = useState(EMPTY_WAREHOUSES);
    const isEditMode = Boolean(warehouse);
    const { deliveryZonesData,isLoading,error } = useDeliveryZone(1, 10);


    useEffect(() => {
        if (warehouse) {
            const {id,created_at,updated_at,...withoutId} = warehouse;
            setForm(
                withoutId
            );
            return;
        }
        setForm(EMPTY_WAREHOUSES);
    }, [warehouse, open]);

    if (!open) {
        return null;
    }

    const onChangeField = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const onSubmit = (event) => {
        event.preventDefault();
        if (isEditMode) {
            onSave(
               form
            );
        } else {
            onSave(form);
        }
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/35 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="mx-4 w-full max-w-lg rounded-xl border border-[#e5e7eb] bg-white shadow-card max-h-[90vh] overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-5 sm:px-7">
                    <h2 className="font-display text-lg font-semibold text-[#1f2937]">
                        {isEditMode ? "Edit Warehouse" : "Add Warehouse"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-6">
                    {/* Warehouse Name */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="name">
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="code">
                                Code
                            </label>
                            <input
                                id="code"
                                name="code"
                                value={form.code}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse code"
                            />
                        </div>
                        <div>
                            <label htmlFor="">Zone</label>
                            < SearchableSelector
                                data={deliveryZonesData?.data?.deliveryZones}
                                placeholder="Select a zone"
                                onSelect={(id) => {
                                    setForm((prev) => ({
                                        ...prev,
                                        zone_id: id,
                                    }));
                                }}
                                onSearchChange={(q) => console.log("search query", q)}
                                value={form.zone_id}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="address">
                                Address
                            </label>
                            <input
                                id="address"
                                name="address"
                                value={form.address}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse address"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="city">
                                City
                            </label>
                            <input
                                id="city"
                                name="city"
                                value={form.city}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse city"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="state">
                                State
                            </label>
                            <input
                                id="state"
                                name="state"
                                value={form.state}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse state"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="country">
                                Country
                            </label>
                            <input
                                id="country"
                                name="country"
                                value={form.country}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse country"
                            />
                        </div>
              
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="lattitude">
                                Latitude
                            </label>
                            <input
                                id="latitude"
                                name="latitude"
                                value={form.latitude}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse latitude"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="longitude">
                                Longitude
                            </label>
                            <input
                                id="longitude"
                                name="longitude"
                                value={form.longitude}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter warehouse longitude"
                            />
                        </div>
                   
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="contact_person">
                                Contact Person
                            </label>
                            <input
                                id="contact_person"
                                name="contact_person"
                                value={form.contact_person}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter contact person name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[#1f2937]" htmlFor="contact_phone">
                                Contact Phone
                            </label>
                            <input
                                id="contact_phone"
                                name="contact_phone"
                                value={form.contact_phone}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                                placeholder="Enter contact person phone number"
                            />
                        </div>
                    
                    <div>
                        <label className="text-sm font-medium text-[#1f2937]" htmlFor="is_active">
                            Status
                        </label>
                        <select
                            id="is_active"
                            name="is_active"
                            value={form.is_active}
                            onChange={onChangeField}
                            className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#0f5132]"
                        >
                            <option value="">Select Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#1f2937] transition-colors hover:bg-[#f3f4f6]"
                >
                    Cancel
                </button>
                <button

                    type="submit"
                    className="rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
                >
                    {isEditMode ? "Save Changes" : "Add Unit"}
                </button>
            </div>
        </form>
      </div >
    </div >
    
  );
};

export default WarehouseModal;
