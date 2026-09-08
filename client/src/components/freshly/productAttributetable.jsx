import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "../common/confirmationModal";
import { useState } from "react";

const productAttributeTable = ({ productAttributes = [], onEdit, onDelete ,isLoading}) => {
  const [isOpen,setIsOpen]=useState(false);
  const [deleteProductAttribute,setDeleteProductAttribute]=useState(null)
  console.log("productAttribute ---------", productAttributes);

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
                Type
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                Value
              </th>

           

              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                Filtrable
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-[#6b7280] sm:px-6">
                Sort Order
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-[#6b7280] sm:px-6">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {productAttributes.map((productAttribute) => (
              <tr
                key={productAttribute.id}
                className="border-b border-[#e5e7eb] transition-colors last:border-0 hover:bg-[#f8faf8]"
              >
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {productAttribute.attribute_name}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {productAttribute.data_type}
                </td>
                <td className="px-5 py-4 font-medium text-[#1f2937] sm:px-6">
                  {productAttribute.attribute_value}
                </td>

                
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      productAttribute.is_filterable
                        ? "bg-[#0f5132]/10 text-[#0f5132]"
                        : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {productAttribute.is_filterable?"True":"False" }
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium `}
                  >
                    {productAttribute.sort_order }
                  </span>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(productAttribute)}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1f2937]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {setDeleteProductType(productAttribute);setIsOpen(true);}}
                      className="rounded-lg p-1.5 text-[#6b7280] transition-colors hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {productAttributes.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#6b7280]"
                >
                  No Product Attribute Found.
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
            onSuccess={() => {onDelete?.(deleteProductAttribute.id);
               setIsOpen(false);
    setDeleteProductAttribute(null);
            }}
            onClose={()=>setIsOpen(false)}

            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default productAttributeTable;