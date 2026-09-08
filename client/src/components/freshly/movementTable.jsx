import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/common/confirmationModal"
import { useState } from "react";

const MovementTable = ({ movements = [], onEdit, onDelete,isLoading }) => {
  console.log("movements ---------", movements);
  const [isModalOpen,setIsModalOpen] =useState(false)
//   const [deleteUnit,setDeleteUnit]=useState(null)
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
                date
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                variant
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                warehouse
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                type
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                quantity
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                before stock
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                after stock
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                reason
              </th>

                        {/* <th className="px-5 py-3.5 text-right font-medium text-[#6b7280] sm:px-6">
                            Actions
                        </th> */}
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => (
              <tr
                key={movement.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]"
              >
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {new Date(movement.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-medium capitalize text-[#6b7280]">
                    {movement.variant_id}
                  </span>
                </td>

                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {movement.warehouse_id}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {movement.movement_type}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {movement.quantity}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {movement.before_stock}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {movement.after_stock}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {movement.reason}
                </td>

               

                {/* <td className="px-5 py-4 sm:px-6">
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
                </td> */}
              </tr>
              
            ))}

            {movements.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#6b7280]"
                >
                  No movements found.
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
         
          </tbody>
        </table>
      </div>
        
    </div>
  );
};

export default MovementTable;