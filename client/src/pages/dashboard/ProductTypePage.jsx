import { Search, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import ProductTypeModal from "@/components/dashboard/ProductTypeModal";
import ProductTypeTable from "@/components/dashboard/ProductTypeTable";
import useProductType from "@/hooks/use-productType"
import useProduct from "@/hooks/use-product";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";

const EMPTY = [];

const PAGE_SIZE = 10;

const ProductTypePage=()=>{
    const [searchTerm, setSearchTerm] = useState("");
        const [showPanel, setShowPanel] = useState(false);
        const [editingProductType, setEditingProductType] = useState(null);
        const [currentPage, setCurrentPage] = useState(1);
        const {data,isLoading,createMutation,updateMutation,deleteMutation}=useProductType(currentPage,PAGE_SIZE)
        const { productSelection } = useProduct({ page: 1, limit: 200 });

        const productTypesList=data?.data?.productTypes ?? EMPTY;
        const pagination=data?.data?.pagination;

        // No per-type product-count endpoint exists — aggregate client-side
        // from the products lookup list (see ADMIN_PANEL_REDESIGN.md).
        const productCountByType = useMemo(() => {
          const products = productSelection?.data?.products ?? [];
          return products.reduce((acc, product) => {
            if (product.product_type_id) {
              acc[product.product_type_id] = (acc[product.product_type_id] || 0) + 1;
            }
            return acc;
          }, {});
        }, [productSelection]);

        const productTypes = useMemo(() => {
          const term = searchTerm.toLowerCase();
          if (!term) return productTypesList;
          return productTypesList.filter(
            (type) => type.name?.toLowerCase().includes(term) || type.code?.toLowerCase().includes(term)
          );
        }, [productTypesList, searchTerm]);

        const closePanel = () => {
          setEditingProductType(null);
          setShowPanel(false);
        };

        const saveProductType=(payload)=>{
          if(editingProductType){
            updateMutation.mutate({id:editingProductType.id,data:payload})
          }else{
          createMutation.mutate(payload)
          }
          closePanel();
        }
         const openEditPanel = (productType) => {
    setEditingProductType(productType);
    setShowPanel(true);
  };
  const handleDelete=(id)=>{
    deleteMutation.mutate(id)
    if (editingProductType?.id === id) closePanel();
  }

    return(
         <div className="space-y-6 lg:space-y-7">
              <PageHeader
                title="Product Types"
                description="Group products by type for easier browsing."
                backTo="/dashboard/products"
                backLabel="Back to Products"
                action={
                  <button
                    onClick={()=>{setEditingProductType(null);setShowPanel(true);}}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Type
                  </button>
                }
              />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
                    <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                      <Search className="h-4 w-4 text-muted-foreground" />

                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                        }}
                        placeholder="Search product types..."
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <ProductTypeTable
                  productTypes={productTypes}
                  productCountByType={productCountByType}
                  isLoading={isLoading}
                  onEdit={openEditPanel}
                  onDelete={handleDelete}
                  selectedId={showPanel ? editingProductType?.id : undefined}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages ?? 0}
                    totalItems={pagination?.totalItems ?? 0}
                    onPageChange={setCurrentPage}
                  />
                </div>

                {showPanel && (
                  <ProductTypeModal productType={editingProductType} onCancel={closePanel} onSave={saveProductType} />
                )}
              </div>
              </div>
    )

}
export default ProductTypePage
