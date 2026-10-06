import { Edit2, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { useState } from "react";

const ProductTypeTable = ({ productTypes = [], onEdit, onDelete, isLoading, productCountByType = {}, selectedId }) => {
  const [isOpen,setIsOpen]=useState(false);
  const [deleteProductType,setDeleteProductType]=useState(null)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Code
              </th>
              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Name
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">
                Products
              </th>

              <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">
                Status
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {productTypes.map((productType) => (
              <tr
                key={productType.id}
                className={`border-b border-border transition-colors last:border-0 hover:bg-muted ${
                  selectedId === productType.id ? "bg-secondary" : ""
                }`}
              >
                <td className="px-5 py-4 sm:px-6">
                  <span className="inline-flex rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                    {productType.code}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium text-foreground sm:px-6">
                  {productType.name}
                </td>

                <td className="px-5 py-4 text-right text-muted-foreground sm:px-6">
                  {productCountByType[productType.id] || 0}
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      productType.is_active
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${productType.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                    {productType.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(productType)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {setDeleteProductType(productType);setIsOpen(true);}}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {productTypes.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No Product Types Found.
                </td>
              </tr>
            )}
            {isLoading &&(
                 <tr>
                <td
                  colSpan={5}
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
            onSuccess={() => {onDelete?.(deleteProductType.id);
               setIsOpen(false);
    setDeleteProductType(null);
            }}
            onClose={()=>setIsOpen(false)}

            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTypeTable;