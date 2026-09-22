import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import VariantTable from "@/components/dashboard/VariantTable";
import VariantModal from "@/components/dashboard/VariantModal";
import Pagination from "@/components/common/Pagination";
import useVariant from "@/hooks/use-variant";
import useProduct from "@/hooks/use-product";
import SearchableSelector from "@/components/common/SearchableSelector";
import StockModal from "@/components/dashboard/StockModal";
import PageHeader from "@/components/dashboard/PageHeader";

const VariantPage=()=>{
    // const [searchTerm, setSearchTerm] = useState("")
        // const [isModalOpen, setIsModalOpen] = useState(false);
        const [searchQuery,setSearchQuery]=useState("")
        const [selectedProductId,setSelectedProductId]= useState(null)
        console.log("selectedProductId",selectedProductId)
        const [currentPage, setCurrentPage] = useState(1);
          const [stockVariantId, setStockVariantId] = useState(null);
        
          const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
          const [editingVariant, setEditingVariant] = useState(null);
        // const {data,isLoading,createMutation,updateMutation,deleteMutation}=useProductAttribute(currentPage,1)
          const {
            variants,
            createVariant,
            updateVariant,
            deleteVariant
          } = useVariant({productId:selectedProductId});
          const {products}=useProduct(searchQuery,currentPage,10)
   
        const pagination=variants?.data?.pagination;

          const openAddVariant = () => {
              if (!selectedProductId) {
    // alert("Please select a product first.");
    toast.error("Please select a product first.");
    return;
  }

    setEditingVariant(null);
    setIsVariantModalOpen(true);
  };

  const openEditVariant = (variant) => {
    setEditingVariant(variant);
    setIsVariantModalOpen(true);
  };
    const saveVariant = (payload) => {
    if (editingVariant) {
      updateVariant.mutate({ id: editingVariant.id, data: {...payload,product_id:selectedProductId} });
    } else {
      createVariant.mutate({...payload, product_id: selectedProductId});
    }
    setIsVariantModalOpen(false);
    setEditingVariant(null);
  };

  const removeVariant = (variantId) => {
    deleteVariant.mutate(variantId);
  };


     
        
    return(
         <div className="space-y-6 lg:space-y-7">
              <PageHeader
                title="Variants"
                description="Manage per-product variants and their stock."
                backTo="/dashboard/products"
                backLabel="Back to Products"
                action={
                  <button
                    onClick={()=>openAddVariant()}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Variant
                  </button>
                }
              />
              <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
                <SearchableSelector
                data={products?.data?.products}
                placeholder="select a product"
                onSelect={(id)=>{setSelectedProductId(id);console.log("selectedProductId",selectedProductId);}}
                onSearchChange={(q)=>setSearchQuery(q)}
                />
              </div>

      <VariantModal
        open={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setEditingVariant(null);
        }}
        variant={editingVariant}
        onSave={saveVariant}
      />
           <VariantTable
           variants={variants}
           onDelete={removeVariant}
           onEdit={openEditVariant}
           onViewStock={(variantId) => setStockVariantId(variantId)}
           />
            <StockModal
        open={Boolean(stockVariantId)}
        variantId={stockVariantId}
        onClose={() => setStockVariantId(null)}
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
export default VariantPage;