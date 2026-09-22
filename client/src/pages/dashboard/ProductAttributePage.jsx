import { Search, Plus } from "lucide-react";
import { useState } from "react";
import ProductAttributeTable from "@/components/dashboard/ProductAttributeTable";
import ProductAttributeModal from "@/components/dashboard/ProductAttributeModal";
import useProductAttribute from "@/hooks/use-productAttribute";
import useProduct from "@/hooks/use-product";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";


const ProductAttributePage=()=>{
    const [searchTerm, setSearchTerm] = useState("");
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingProductAttribute, setEditingProductAttribute] = useState(null);
        const [currentPage, setCurrentPage] = useState(1);
        const {data,isLoading,createMutation,updateMutation,deleteMutation}=useProductAttribute(currentPage,1)
       
        const productAttributes=data?.data?.productAttributes;
        const pagination=data?.data?.pagination;

        const saveProductAttribute=(payload)=>{
          if(editingProductAttribute){
            updateMutation.mutate({id:editingProductAttribute.id,data:payload})
          }else{
          createMutation.mutate(payload)
          }
        }
         const openEditModal = (productAttribute) => {
    setEditingProductAttribute(productAttribute);
    setIsModalOpen(true);
  };
  const handleDelete=(id)=>{
    deleteMutation.mutate(id)
  }
        
    return(
         <div className="space-y-6 lg:space-y-7">
              <PageHeader
                title="Product Attributes"
                description="Define custom attributes available to your products."
                backTo="/dashboard/products"
                backLabel="Back to Products"
                action={
                  <button
                    onClick={()=>setIsModalOpen(true)}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Attribute
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
                    placeholder="Search product attributes..."
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <ProductAttributeModal
              productAttribute={editingProductAttribute}
              open={isModalOpen}
              onClose={()=>{setIsModalOpen(false);
                setEditingProductAttribute(null)
              }}
              onSave={saveProductAttribute}
              />
              <ProductAttributeTable
              productAttributes={productAttributes}
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
export default ProductAttributePage