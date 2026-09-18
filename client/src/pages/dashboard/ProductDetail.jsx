import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Plus, Package, Tag, Layers, BadgeCheck, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProductApi from "@/apis/productApi";
import InventoryApi from "@/apis/inventoryApi";
import useVariant from "@/hooks/use-variant";
import VariantTable from "@/components/dashboard/VariantTable";
import VariantModal from "@/components/dashboard/VariantModal";
import StockModal from "@/components/dashboard/StockModal";
// import AssignPromotionModal from "@/components/dashboard/AssignPromotionModal";

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value || "N/A"}</p>
    </div>
  </div>
);

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  // const [assignPromotingProduct, setAssignPromotingProduct] = useState(null);

  const { data: productResponse, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => ProductApi.getProductById(productId),
  });


  // const { data: inventoryResponse, isLoading: inventoryLoading } = useQuery({
  //   queryKey: ["inventory", "product", productId],
  //   queryFn: () => InventoryApi.fetchInventoryByProductId(productId),
  // });

  const product = productResponse?.data;
  console.log("product from detail page",product)

  // Utilize the new variant hook
  const {
    variants,
    createVariant: createMutation,
    updateVariant: updateMutation,
    deleteVariant: deleteMutation
  } = useVariant({productId});

  // const inventoryItems = inventoryResponse?.data || [];
  // const variantsWithStock = variants.map(variant => {
  //   const inv = inventoryItems.find(item => item.variantId === variant.id);
  //   return { ...variant, stock: inv?.stock || 0 };
  // });

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [stockVariantId, setStockVariantId] = useState(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-foreground">Product not found or failed to load</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/products")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>
      </div>
    );
  }

  const openAddVariant = () => {
    setEditingVariant(null);
    setIsVariantModalOpen(true);
  };

  const openEditVariant = (variant) => {
    setEditingVariant(variant);
    setIsVariantModalOpen(true);
  };
    const saveVariant = (payload) => {
    if (editingVariant) {
      updateMutation.mutate({ id: editingVariant.id, data: {id: editingVariant.id,product_id:productId,quantity:payload.value,price:payload.price,mrp:payload.mrp,measurement_unit_id:payload.measurement_unit_id,status:payload.status,barcode:payload.barcode} });
    } else {
      createMutation.mutate({product_id:productId,quantity:payload.value,price:payload.price,mrp:payload.mrp,measurement_unit_id:payload.measurement_unit_id,status:payload.status,barcode:payload.barcode});
    }
    setIsVariantModalOpen(false);
    setEditingVariant(null);
  };

  const deleteVariant = (variantId) => {
    deleteMutation.mutate(variantId);
  };



  const priceRange =
    variants.length > 0
      ? `₹${Math.min(...variants.map((v) => v.price)).toFixed(2)} – ₹${Math.max(...variants.map((v) => v.price)).toFixed(2)}`
      : "No variants";

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate("/dashboard/products")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      {/* Product info card */}
      <div className="rounded-xl border border-border bg-white shadow-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-7">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted text-4xl">
            {product.name}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{product.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{product.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${product.status ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                >
                  {product.status}
                </span>
                {product.is_organic && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    <Leaf className="h-3 w-3" />
                    Organic
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem icon={Tag} label="Category" value={product.category?.name || product.category} />
              <InfoItem icon={Package} label="Type" value={product.productType?.name} />
              <InfoItem icon={BadgeCheck} label="Brand" value={product.brand?.name} />
              <InfoItem icon={Layers} label="Price Range" value={priceRange} />
            </div>
          </div>
        </div>
      </div>

      {/* Variants section */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Variants</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{variants.length} variant{variants.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={openAddVariant}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </button>
        </div>
      </div>

      <VariantTable variants={variants} onEdit={openEditVariant} onDelete={deleteVariant} onViewStock={setStockVariantId} />

      <VariantModal
        open={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setEditingVariant(null);
        }}
        variant={editingVariant}
        onSave={saveVariant}
      />
      <StockModal
        open={Boolean(stockVariantId)}
        variantId={stockVariantId}
        onClose={() => setStockVariantId(null)}
      />
       {/* <AssignPromotionModal 
        isOpen={!!assignPromotingProduct} 
        onClose={() => setAssignPromotingProduct(null)} 
        product={product}
        variantId={assignPromotingProduct} 
      /> */}
    </div>
  );
};

export default ProductDetail;
