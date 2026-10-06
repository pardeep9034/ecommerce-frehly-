import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Star, ImagePlus, Edit2, Check } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import ProductApi from "@/apis/productApi";
import productAttributeApi from "@/apis/productAttributeApi";
import useVariant from "@/hooks/use-variant";
import useProductImage from "@/hooks/use-productImage";
import useCategory from "@/hooks/use-category";
import useProductType from "@/hooks/use-productType";
import useBrand from "@/hooks/use-brand";
import VariantTable from "@/components/dashboard/VariantTable";
import VariantModal from "@/components/dashboard/VariantModal";
import StockModal from "@/components/dashboard/StockModal";
import ProductAttributeModal from "@/components/dashboard/ProductAttributeModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import TableSkeleton from "@/components/dashboard/TableSkeleton";
import SearchableSelector from "@/components/common/SearchableSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";

const initials = (name = "") =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", dot: "bg-muted-foreground" },
  { value: "ACTIVE", label: "Active", dot: "bg-success" },
  { value: "INACTIVE", label: "Inactive", dot: "bg-warning" },
  { value: "ARCHIVED", label: "Archived", dot: "bg-destructive" },
];

const STATUS_BADGE = {
  ACTIVE: "bg-success/10 text-success",
  DRAFT: "bg-muted text-muted-foreground",
  INACTIVE: "bg-amber/10 text-amber",
  ARCHIVED: "bg-muted text-foreground",
};

const detailsSchema = z.object({
  name: z.string().min(1, "Enter a product name"),
  short_description: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.string().min(1, "Select a status"),
  category_id: z.coerce.string().min(1, "Select a category"),
  brand_id: z.coerce.string().optional().default(""),
  product_type_id: z.coerce.string().optional().default(""),
  is_organic: z.boolean().default(false),
});

const UPDATE_PRODUCT_FIELDS = ["id","name", "description", "short_description", "category_id", "brand_id", "product_type_id", "is_organic", "status"];

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("details");

  const { data: productResponse, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => ProductApi.getProductById(productId),
  });
  const product = productResponse?.data;

  const { categories: categoriesData } = useCategory();
  const { data: productTypeData } = useProductType(1, 100);
  const { brandsData } = useBrand(1, 100);
  const categoriesList = categoriesData?.data?.categories || [];
  const productTypesList = productTypeData?.data?.productTypes || [];
  const brandsList = brandsData?.data?.brand || [];

  const form = useForm({ resolver: zodResolver(detailsSchema) });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        short_description: product.short_description || "",
        description: product.description || "",
        status: product.status || "",
        category_id: product.category?.id ? String(product.category.id) : "",
        brand_id: product.brand?.id ? String(product.brand.id) : "",
        product_type_id: product.productType?.id ? String(product.productType.id) : "",
        is_organic: Boolean(product.is_organic),
      });
    }
  }, [product, form]);

  const updateProductMutation = useMutation({
    mutationFn: (data) => ProductApi.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Product saved");
    },
  });

  const saveDetails = form.handleSubmit((values) => {
    const data = Object.fromEntries(Object.entries(values).filter(([key]) => UPDATE_PRODUCT_FIELDS.includes(key)));
    // updateProductSchema (product-service validate.js) requires `id` in the body, and form values don't carry it.
    updateProductMutation.mutate({ ...data, id: Number(productId) });
  });

  // Variants tab
  const {
    variants,
    createVariant: createVariantMutation,
    updateVariant: updateVariantMutation,
    deleteVariant: deleteVariantMutation,
  } = useVariant({ productId, limit: 100 });
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [stockVariantId, setStockVariantId] = useState(null);

  const saveVariant = (payload) => {
    if (editingVariant) {
      updateVariantMutation.mutate({ id: editingVariant.id, data: { ...payload, product_id: Number(productId) } });
    } else {
      createVariantMutation.mutate({ ...payload, product_id: Number(productId) });
    }
    setIsVariantModalOpen(false);
    setEditingVariant(null);
  };

  // Images tab
  const { images, addImage, deleteImage, setPrimaryImage } = useProductImage(productId);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [deleteImageId, setDeleteImageId] = useState(null);

  const submitImage = (event) => {
    event.preventDefault();
    if (!newImageUrl.trim()) return;
    addImage.mutate(
      { image_url: newImageUrl.trim(), is_primary: images.length === 0 },
      { onSuccess: () => setNewImageUrl("") }
    );
  };

  // Attributes tab
  const { data: attributesResponse, isLoading: attributesLoading } = useQuery({
    queryKey: ["productAttributesByProduct", productId],
    queryFn: () => productAttributeApi.getByProductId(productId),
    enabled: !!productId,
  });
  const attributes = attributesResponse?.data?.rows || [];
  const invalidateAttributes = () => queryClient.invalidateQueries({ queryKey: ["productAttributesByProduct", productId] });

  const createAttributeMutation = useMutation({
    mutationFn: (data) => productAttributeApi.createProductAttribute(data),
    onSuccess: invalidateAttributes,
  });
  const updateAttributeMutation = useMutation({
    mutationFn: ({ id, data }) => productAttributeApi.updateProductAttribute(id, data),
    onSuccess: invalidateAttributes,
  });
  const deleteAttributeMutation = useMutation({
    mutationFn: (id) => productAttributeApi.deleteProductAttribute(id),
    onSuccess: invalidateAttributes,
  });

  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [deleteAttributeId, setDeleteAttributeId] = useState(null);

  const saveAttribute = (payload) => {
    if (editingAttribute) {
      updateAttributeMutation.mutate({ id: editingAttribute.id, data: payload });
    } else {
      createAttributeMutation.mutate(payload);
    }
    setIsAttributeModalOpen(false);
    setEditingAttribute(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 lg:space-y-7">
        <div className="h-5 w-32 rounded skeleton-shimmer" />
        <div className="rounded-xl border border-border bg-white shadow-card">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-7">
            <div className="h-20 w-20 shrink-0 rounded-xl skeleton-shimmer" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-6 w-1/3 rounded skeleton-shimmer" style={{ animationDelay: "80ms" }} />
              <div className="h-4 w-1/4 rounded skeleton-shimmer" style={{ animationDelay: "160ms" }} />
            </div>
          </div>
        </div>
        <TableSkeleton rows={4} columns={4} />
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

  const subtitle = [
    product.category?.name,
    product.brand?.name,
    `${variants.length} variant${variants.length !== 1 ? "s" : ""}`
    
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6 lg:space-y-7">
      <button
        type="button"
        onClick={() => navigate("/dashboard/products")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      <div className="rounded-xl border border-border bg-white shadow-card">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-7">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl font-bold text-primary">
            {initials(product.name) || "?"}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{product.name}</h1>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_BADGE[product.status] || "bg-muted text-muted-foreground"}`}>
                  {product.status?.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast("Preview isn't wired up yet")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Preview in app
                </button>
                <button
                  type="button"
                  onClick={saveDetails}
                  disabled={updateProductMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Save changes
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants · {variants.length}</TabsTrigger>
          <TabsTrigger value="images">Images · {images.length}</TabsTrigger>
          <TabsTrigger value="attributes">Attributes · {attributes.length}</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "details" && (
        <Form {...form}>
          <form onSubmit={saveDetails} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
              <h2 className="font-display text-base font-semibold text-foreground">Product details</h2>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter short description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Enter product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
              <h2 className="font-display text-base font-semibold text-foreground">Organise</h2>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                      <FormControl>
                        <SelectTrigger id={field.name}>
                          <span className="flex items-center gap-2">
                            {field.value && (
                              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_OPTIONS.find((opt) => opt.value === field.value)?.dot}`} />
                            )}
                            <SelectValue placeholder="Select status">
                              {STATUS_OPTIONS.find((opt) => opt.value === field.value)?.label}
                            </SelectValue>
                          </span>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${opt.dot}`} />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={categoriesList}
                        labelKey="name"
                        valueKey="id"
                        placeholder="Search category"
                        value={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={brandsList}
                        placeholder="Search brand"
                        value={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product type</FormLabel>
                    <FormControl>
                      <SearchableSelector
                        id={field.name}
                        ref={field.ref}
                        data={productTypesList}
                        placeholder="Search product type"
                        value={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_organic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border px-4 py-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Organic product</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      )}

      {tab === "variants" && (
        <div className="space-y-5">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => { setEditingVariant(null); setIsVariantModalOpen(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add variant
            </button>
          </div>
          <VariantTable
            variants={variants}
            onEdit={(variant) => { setEditingVariant(variant); setIsVariantModalOpen(true); }}
            onDelete={(id) => deleteVariantMutation.mutate(id)}
            onViewStock={setStockVariantId}
          />
        </div>
      )}

      {tab === "images" && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-card sm:p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <img src={image.image_url} alt={image.alt_text || product.name} className="h-full w-full object-cover" />
                {image.is_primary && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground">
                    <Star className="h-3 w-3" />
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 flex items-end justify-end gap-1 bg-foreground/0 p-2 opacity-0 transition-opacity group-hover:bg-foreground/10 group-hover:opacity-100">
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage.mutate(image.id)}
                      title="Set as primary"
                      className="rounded-lg bg-white p-1.5 text-muted-foreground shadow-card hover:text-success"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteImageId(image.id)}
                    title="Delete image"
                    className="rounded-lg bg-white p-1.5 text-muted-foreground shadow-card hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <form onSubmit={submitImage} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-3 text-center">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                value={newImageUrl}
                onChange={(event) => setNewImageUrl(event.target.value)}
                placeholder="Paste image URL"
                className="w-full rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground outline-none"
              />
              <button type="submit" className="text-xs font-medium text-primary hover:underline">
                Add image
              </button>
            </form>
          </div>
          <p className="text-xs text-muted-foreground">
            Images are added by URL, not file upload — see ADMIN_PANEL_REDESIGN.md. The first image shown is the primary one.
          </p>
        </div>
      )}

      {tab === "attributes" && (
        <div className="space-y-5">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => { setEditingAttribute(null); setIsAttributeModalOpen(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add attribute
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Attribute</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Value</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Type</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground sm:px-6">Filterable</th>
                  <th className="px-5 py-3.5 text-right font-medium text-muted-foreground sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attribute) => (
                  <tr key={attribute.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted">
                    <td className="px-5 py-4 font-medium text-foreground sm:px-6">{attribute.attribute_name}</td>
                    <td className="px-5 py-4 text-muted-foreground sm:px-6">{attribute.attribute_value}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <span className="inline-flex rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                        {attribute.data_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${attribute.is_filterable ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {attribute.is_filterable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditingAttribute(attribute); setIsAttributeModalOpen(true); }}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteAttributeId(attribute.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {attributes.length === 0 && !attributesLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No attributes added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VariantModal
        open={isVariantModalOpen}
        onClose={() => { setIsVariantModalOpen(false); setEditingVariant(null); }}
        variant={editingVariant}
        onSave={saveVariant}
      />
      <StockModal open={Boolean(stockVariantId)} variantId={stockVariantId} onClose={() => setStockVariantId(null)} />
      <ProductAttributeModal
        open={isAttributeModalOpen}
        onClose={() => { setIsAttributeModalOpen(false); setEditingAttribute(null); }}
        productAttribute={editingAttribute}
        lockedProductId={productId}
        lockedProductName={product.name}
        onSave={saveAttribute}
      />
      <ConfirmationModal
        open={Boolean(deleteAttributeId)}
        title="Delete this attribute?"
        cancelBtnName="Cancel"
        proceedBtnName="Delete"
        onClose={() => setDeleteAttributeId(null)}
        onSuccess={() => { deleteAttributeMutation.mutate(deleteAttributeId); setDeleteAttributeId(null); }}
      />
      <ConfirmationModal
        open={Boolean(deleteImageId)}
        title="Delete this image?"
        cancelBtnName="Cancel"
        proceedBtnName="Delete"
        onClose={() => setDeleteImageId(null)}
        onSuccess={() => { deleteImage.mutate(deleteImageId); setDeleteImageId(null); }}
      />
    </div>
  );
};

export default ProductDetail;
