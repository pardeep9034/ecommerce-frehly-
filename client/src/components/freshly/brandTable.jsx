import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "../common/confirmationModal";
import { useState } from "react";

const BrandTable = ({ brands = [], onEdit, onDelete ,isLoading}) => {
  const [isOpen,setIsOpen]=useState(false);
  const [deleteBrand,setDeleteBrand]=useState(null)
  console.log("brand ---------", brands);

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f8faf8]">
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                Name
              </th>

           

              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                Status
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-[#6b7280] sm:px-6">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {brands.map((brand) => (
              <tr
                key={brand.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]"
              >
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {brand.name}
                </td>

                
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      brand.is_active
                        ? "bg-[#0f5132]/10 text-[#0f5132]"
                        : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {brand.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(brand)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {setDeleteBrand(brand);setIsOpen(true);}}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {brands.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#6b7280]"
                >
                  No brands found.
                </td>
              </tr>
            )}
            {isLoading &&(
                 <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#6b7280]"
                >
                  Loading ....
                </td>
              </tr>
            )}
            <ConfirmationModal
            open={isOpen}
            title={"are you sure to delete this"}
            cancelBtnName={"Cancel"}
            proceedBtnName={"Delete"}
            onSuccess={() => {onDelete?.(deleteBrand.id);
               setIsOpen(false);
    setDeleteBrand(null);
            }}
            onClose={()=>setIsOpen(false)}

            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BrandTable;