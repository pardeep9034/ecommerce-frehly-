import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/common/confirmationModal"
import { useState } from "react";

const UnitsTable = ({ units = [], onEdit, onDelete,isLoading }) => {
  console.log("units ---------", units);
  const [isModalOpen,setIsModalOpen] =useState(false)
  const [deleteUnit,setDeleteUnit]=useState(null)
//   if(isLoading){
//     return (<span className="text-sm text-gray-500">
//     Loading...
//   </span>)
//   }

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
                Code
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                Category
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
            {units.map((unit) => (
              <tr
                key={unit.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]"
              >
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {unit.name}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium capitalize text-[#6b7280]">
                    {unit.code}
                  </span>
                </td>

                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {unit.category}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      unit.is_active
                        ? "bg-[#0f5132]/10 text-[#0f5132]"
                        : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {unit.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(unit)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={()=>{setIsModalOpen(true),setDeleteUnit(unit)}}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              
            ))}

            {units.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#6b7280]"
                >
                  No units found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#6b7280]"
                >
              Loading ...
                </td>
              </tr>
            )}
         <ConfirmationModal
            open={isModalOpen}
            title={"are you sure to delete this"}
            cancelBtnName={"Cancel"}
            proceedBtnName={"Delete"}
            onSuccess={() => {onDelete?.(deleteUnit.id);
              setIsModalOpen(false);
              setDeleteUnit(null)
            }}
            onClose={()=>setIsModalOpen(false)}


            />
          </tbody>
        </table>
      </div>
        
    </div>
  );
};

export default UnitsTable;