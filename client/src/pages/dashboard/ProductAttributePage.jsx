import { Search, Plus ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductAttributeTable from "@/components/dashboard/ProductAttributeTable";
import ProductAttributeModal from "@/components/dashboard/ProductAttributeModal";
import useProductAttribute from "@/hooks/use-productAttribute";
import useProduct from "@/hooks/use-product";
import Pagination from "@/components/common/Pagination";


const ProductAttributePage=()=>{
    const [searchTerm, setSearchTerm] = useState("");
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingProductAttribute, setEditingProductAttribute] = useState(null);
        const [currentPage, setCurrentPage] = useState(1);
        const navigate=useNavigate()
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
                 <button
                        type="button"
                        onClick={() => navigate("/dashboard/products")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Products
                      </button>
              <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                  
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                    <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                      <Search className="h-4 w-4 text-muted-foreground" />
        
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                        }}
                        placeholder="Search units..."
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
        
                  <button
                    onClick={()=>setIsModalOpen(true)}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Attribute
                  </button>
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