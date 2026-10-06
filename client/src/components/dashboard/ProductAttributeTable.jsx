import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { useState } from "react";

const ProductAttributeTable = ({ productAttributes = [], onEdit, onDelete, isLoading, productsById = {}, selectedId }) => {
  const [isOpen,setIsOpen]=useState(false);
  const [deleteProductAttribute,setDeleteProductAttribute]=useState(null)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Product
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Attribute
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Value
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Type
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Filterable
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Sort
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {productAttributes.map((productAttribute) => (
              <tr
                key={productAttribute.id}
                className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${
                  selectedId === productAttribute.id ? "bg-secondary" : ""
                }`}
              >
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {productsById[productAttribute.product_id]?.name || `#${productAttribute.product_id}`}
                </td>
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {productAttribute.attribute_name}
                </td>
                <td className="px-5 py-4 text-foreground sm:px-6">
                  {productAttribute.attribute_value}
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                    {productAttribute.data_type?.toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      productAttribute.is_filterable
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${productAttribute.is_filterable ? "bg-success" : "bg-muted-foreground"}`} />
                    {productAttribute.is_filterable ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {productAttribute.sort_order}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(productAttribute)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {setDeleteProductAttribute(productAttribute);setIsOpen(true);}}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive"
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
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No Product Attribute Found.
                </td>
              </tr>
            )}
            {isLoading &&(
                 <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
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

export default ProductAttributeTable;