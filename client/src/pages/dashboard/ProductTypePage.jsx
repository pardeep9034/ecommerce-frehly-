import { Search, Plus } from "lucide-react";
import { useState } from "react";
import ProductTypeModal from "@/components/dashboard/ProductTypeModal";
import ProductTypeTable from "@/components/dashboard/ProductTypeTable";
import useProductType from "@/hooks/use-productType"
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";


const ProductTypePage=()=>{
    const [searchTerm, setSearchTerm] = useState("");
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingProductType, setEditingProductType] = useState(null);
        const [currentPage, setCurrentPage] = useState(1);
        const {data,isLoading,createMutation,updateMutation,deleteMutation}=useProductType(currentPage,1)
        const productTypes=data?.data?.productTypes;
        const pagination=data?.data?.pagination;

        const saveProductType=(payload)=>{
          if(editingProductType){
            updateMutation.mutate({id:editingProductType.id,data:payload})
          }else{
          createMutation.mutate(payload)
          }
        }
         const openEditModal = (productType) => {
    setEditingProductType(productType);
    setIsModalOpen(true);
  };
  const handleDelete=(id)=>{
    deleteMutation.mutate(id)
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
                    onClick={()=>setIsModalOpen(true)}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Type
                  </button>
                }
              />
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
              <ProductTypeModal
              productType={editingProductType}
              open={isModalOpen}
              onClose={()=>{setIsModalOpen(false);
                setEditingProductType(null)
              }}
              onSave={saveProductType}
              />
              <ProductTypeTable
              productTypes={productTypes}
              onEdit={openEditModal}
              onDelete={handleDelete}

              />
                <Pagination
  currentPage={currentPage}
  totalPages={pagination?.totalPages ?? 0}
  totalItems={pagination?.totalItems ?? 0}
  onPageChange={setCurrentPage}
/>
        
              </div>
    )

}
export default ProductTypePage