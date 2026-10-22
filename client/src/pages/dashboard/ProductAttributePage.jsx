import { Search, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductAttributeTable from "@/components/dashboard/ProductAttributeTable";
import ProductAttributePanel from "@/components/dashboard/ProductAttributePanel";
import useProductAttribute from "@/hooks/use-productAttribute";
import useProduct from "@/hooks/use-product";
import Pagination from "@/components/common/Pagination";
import PageHeader from "@/components/dashboard/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = [];

const PAGE_SIZE = 10;

const ProductAttributePage=()=>{
    const [searchTerm, setSearchTerm] = useState("");
        const [search, setSearch] = useState("");
        const [showPanel, setShowPanel] = useState(false);
        const [editingProductAttribute, setEditingProductAttribute] = useState(null);
        const [currentPage, setCurrentPage] = useState(1);
        const [productFilter, setProductFilter] = useState("All");
        const [filterableOnly, setFilterableOnly] = useState(false);

        useEffect(() => {
          const timer = setTimeout(() => setSearch(searchTerm.trim()), 400);
          return () => clearTimeout(timer);
        }, [searchTerm]);

        useEffect(() => {
          setCurrentPage(1);
        }, [search, productFilter, filterableOnly]);

        const {data,isLoading,createMutation,updateMutation,deleteMutation}=useProductAttribute(currentPage,PAGE_SIZE,{
          search,
          product_id: productFilter === "All" ? undefined : productFilter,
          is_filterable: filterableOnly || undefined,
        })
        const { productSelection } = useProduct({ page: 1, limit: 200 });

        const productAttributes=data?.data?.productAttributes ?? EMPTY;
        const pagination=data?.data?.pagination;
        const productsList = productSelection?.data?.products ?? EMPTY;
        const productsById = useMemo(
          () => Object.fromEntries(productsList.map((product) => [product.id, product])),
          [productsList]
        );

        const closePanel = () => {
          setEditingProductAttribute(null);
          setShowPanel(false);
        };

        const saveProductAttribute=(payload)=>{
          if(editingProductAttribute){
            updateMutation.mutate({id:editingProductAttribute.id,data:payload})
          }else{
          createMutation.mutate(payload)
          }
          closePanel();
        }
         const openEditPanel = (productAttribute) => {
    setEditingProductAttribute(productAttribute);
    setShowPanel(true);
  };
  const handleDelete=(id)=>{
    deleteMutation.mutate(id)
    if (editingProductAttribute?.id === id) closePanel();
  }

    return(
         <div className="space-y-6 lg:space-y-7">
              <PageHeader
                title="Product Attributes"
                description="Define custom attributes available to your products."
                backTo="/admin/products"
                backLabel="Back to Products"
                action={
                  <button
                    onClick={()=>{setEditingProductAttribute(null);setShowPanel(true);}}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product Attribute
                  </button>
                }
              />
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="rounded-xl border border-border bg-white p-4 shadow-card sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(event) => {
                            setSearchTerm(event.target.value);
                          }}
                          placeholder="Search attribute or value..."
                          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                      </div>

                      <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="min-w-45 py-2.5">
                          <SelectValue>{productFilter === "All" ? "All products" : productsById[productFilter]?.name}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All products</SelectItem>
                          {productsList.map((product) => (
                            <SelectItem key={product.id} value={String(product.id)}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <button
                        type="button"
                        aria-pressed={filterableOnly}
                        onClick={() => setFilterableOnly((prev) => !prev)}
                        className={`inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                          filterableOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        Filterable only
                      </button>
                    </div>
                  </div>
                  <ProductAttributeTable
                  productAttributes={productAttributes}
                  productsById={productsById}
                  isLoading={isLoading}
                  onEdit={openEditPanel}
                  onDelete={handleDelete}
                  selectedId={showPanel ? editingProductAttribute?.id : undefined}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages ?? 0}
                    totalItems={pagination?.totalItems ?? 0}
                    onPageChange={setCurrentPage}
                  />
                </div>

                {showPanel && (
                  <ProductAttributePanel
                    productAttribute={editingProductAttribute}
                    onCancel={closePanel}
                    onSave={saveProductAttribute}
                  />
                )}
              </div>
              </div>
    )

}
export default ProductAttributePage
