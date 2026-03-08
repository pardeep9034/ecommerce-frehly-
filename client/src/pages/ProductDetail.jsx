import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Plus, Package, Tag, Layers, BadgeCheck, Leaf } from "lucide-react";
import VariantTable from "@/components/freshly/VariantTable";
import VariantModal from "@/components/freshly/VariantModal";

const MOCK_PRODUCTS = {
  1: {
    id: 1,
    name: "Organic Bananas",
    slug: "organic-bananas",
    category: "Fruits",
    productType: "Fresh Produce",
    brand: "Freshly",
    description: "Premium organic bananas sourced from sustainable farms. Rich in potassium and naturally sweet, perfect for smoothies, baking, or a quick healthy snack.",
    isOrganic: true,
    status: true,
    emoji: "🍌",
    variants: [
      { id: 1, unitType: "weight", value: 1, unit: "kg", price: 2.99, mrp: 3.49, status: true },
      { id: 2, unitType: "weight", value: 500, unit: "g", price: 1.69, mrp: 1.99, status: true },
      { id: 3, unitType: "pack", value: 6, unit: "pack", price: 2.49, mrp: 2.99, status: true },
    ],
  },
  2: {
    id: 2,
    name: "Fresh Salmon Fillet",
    slug: "fresh-salmon-fillet",
    category: "Meat",
    productType: "Seafood",
    brand: "Freshly",
    description: "Atlantic salmon fillet, skinless and boneless. Rich in omega-3 fatty acids, perfect for grilling, baking, or pan-searing.",
    isOrganic: false,
    status: true,
    emoji: "🐟",
    variants: [
      { id: 4, unitType: "weight", value: 250, unit: "g", price: 6.99, mrp: 7.99, status: true },
      { id: 5, unitType: "weight", value: 500, unit: "g", price: 12.99, mrp: 14.99, status: true },
      { id: 6, unitType: "piece", value: 1, unit: "pc", price: 9.99, mrp: 11.49, status: false },
    ],
  },
  3: {
    id: 3,
    name: "Whole Milk 1L",
    slug: "whole-milk-1l",
    category: "Dairy",
    productType: "Dairy",
    brand: "Freshly",
    description: "Farm-fresh whole milk, pasteurized and homogenized. Great source of calcium and vitamin D.",
    isOrganic: false,
    status: true,
    emoji: "🥛",
    variants: [
      { id: 7, unitType: "pack", value: 1, unit: "pack", price: 3.49, mrp: 3.99, status: true },
      { id: 8, unitType: "pack", value: 2, unit: "pack", price: 6.49, mrp: 7.98, status: true },
    ],
  },
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0f5132]/10">
      <Icon className="h-4 w-4 text-[#0f5132]" />
    </div>
    <div>
      <p className="text-xs font-medium text-[#6b7280]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#1f2937]">{value}</p>
    </div>
  </div>
);

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const product = MOCK_PRODUCTS[productId];

  const [variants, setVariants] = useState(product?.variants || []);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-medium text-[#1f2937]">Product not found</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/products")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
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
      setVariants((prev) =>
        prev.map((v) => (v.id === editingVariant.id ? { ...v, ...payload, id: editingVariant.id } : v))
      );
      return;
    }
    setVariants((prev) => [...prev, { ...payload, id: Date.now() }]);
  };

  const deleteVariant = (variantId) => {
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  const priceRange =
    variants.length > 0
      ? `$${Math.min(...variants.map((v) => v.price)).toFixed(2)} – $${Math.max(...variants.map((v) => v.price)).toFixed(2)}`
      : "No variants";

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate("/dashboard/products")}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1f2937]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      {/* Product info card */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-7">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#f3f4f6] text-4xl">
            {product.emoji}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-[#1f2937] sm:text-2xl">{product.name}</h1>
                <p className="mt-1 text-sm text-[#6b7280]">{product.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    product.status ? "bg-[#0f5132]/10 text-[#0f5132]" : "bg-[#f3f4f6] text-[#6b7280]"
                  }`}
                >
                  {product.status ? "Active" : "Inactive"}
                </span>
                {product.isOrganic && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#16a34a]/10 px-3 py-1 text-xs font-medium text-[#16a34a]">
                    <Leaf className="h-3 w-3" />
                    Organic
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#6b7280]">{product.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem icon={Tag} label="Category" value={product.category} />
              <InfoItem icon={Package} label="Type" value={product.productType} />
              <InfoItem icon={BadgeCheck} label="Brand" value={product.brand} />
              <InfoItem icon={Layers} label="Price Range" value={priceRange} />
            </div>
          </div>
        </div>
      </div>

      {/* Variants section */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1f2937]">Variants</h2>
            <p className="mt-0.5 text-sm text-[#6b7280]">{variants.length} variant{variants.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={openAddVariant}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0b4128]"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </button>
        </div>
      </div>

      <VariantTable variants={variants} onEdit={openEditVariant} onDelete={deleteVariant} />

      <VariantModal
        open={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setEditingVariant(null);
        }}
        variant={editingVariant}
        onSave={saveVariant}
      />
    </div>
  );
};

export default ProductDetail;
