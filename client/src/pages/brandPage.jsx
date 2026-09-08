import { Search, Plus ,ArrowLeft} from "lucide-react";
import { useState } from "react";
import BrandTable from "@/components/freshly/brandTable";
import useBrand from "@/hooks/use-brand";
import { useNavigate } from "react-router-dom";
import BrandModal from "@/components/freshly/brandModal";
import Pagination from "@/components/common/pagination";
const Brand = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage,setCurrentPage]=useState(1);
  const [isModalOpen,setIsModalOpen]=useState(false)
  const [editingBrand,setEditingBrand]=useState(null)
  const navigate=useNavigate()
  const { brandsData,isLoading,error,createMutation,updateMutation,deleteMutation } = useBrand(currentPage,1);

  console.log("brands page", brandsData);

  const brands = brandsData?.data?.brand ?? [];
  const pagination=brandsData?.data?.pagination??[];

  const saveBrand=(payload)=>{
    if(editingBrand){
updateMutation.mutate({id:editingBrand.id,data:payload})
    }
    createMutation.mutate(payload)
  }
  const handleDelete = (brandId) => {
    deleteMutation.mutate(brandId);
  };

  return (
    <div className="space-y-6 lg:space-y-7">
        <button
                        type="button"
                        onClick={() => navigate("/dashboard/products")}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1f2937]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Products
                      </button>
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3.5 py-2.5">
              <Search className="h-4 w-4 text-[#6b7280]" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search units..."
                className="w-full bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#6b7280]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={()=>setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
          >
            <Plus className="h-4 w-4" />
            Add brand
          </button>
        </div>
      </div>

      <BrandTable brands={brands} onDelete={handleDelete} isLoading={isLoading} onEdit={(brand)=>{setEditingBrand(brand),setIsModalOpen(true)}}/>
    <Pagination
  currentPage={currentPage}
  totalPages={pagination?.totalPages ?? 0}
  totalItems={pagination?.totalItems ?? 0}
  onPageChange={setCurrentPage}
/>  
<BrandModal
brand={editingBrand}

open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBrand(null);
        }}
        onSave={saveBrand}
/>
  </div>
  );
};

export default Brand;