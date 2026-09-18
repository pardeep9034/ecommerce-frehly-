import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ProductApi from "../../apis/productApi";
import VariantApi from "../../apis/variantApi";
import SearchableSelector from "@/components/common/SearchableSelector";
import useProduct from "@/hooks/use-product";
import useVariant from "@/hooks/use-variant";

const EMPTY_INVENTORY = {
    variantId: "",
    warehouseId: "",
    stock: 0,
    reservedStock: 0,
    lowStockAlert: 5,
};

const getApiList = (response, key) => {
    const data = response?.data ?? response;
    if (Array.isArray(data)) return data;
    return data?.[key] ?? data?.rows ?? [];
};

const InventoryModal = ({ open, onClose, inventory, onSave, warehouses = [], selectedWarehouseId, isWarehousesLoading }) => {
    const [form, setForm] = useState(EMPTY_INVENTORY);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [variantIds,setVariantIds]=useState([])
    const [variants, setVariants] = useState([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const [isLoadingVariants, setIsLoadingVariants] = useState(false);
    const [selectionError, setSelectionError] = useState("");
    const isEditMode = Boolean(inventory);

    const {searchedProduct}=useProduct({page:1,limit:10,search:productSearch})
    const {variantInfo}=useVariant({variantIds:searchedProduct?.data?.variantIds})
    useEffect(() => {
        if (inventory) {
            const existingVariant = inventory.variant;
            setForm({
                variantId: inventory.variantId || inventory.variant_id || "",
                warehouseId: inventory.warehouse_id || inventory.warehouseId || "",
                stock: inventory.stock ?? inventory.current_stock ?? 0,
                reservedStock: inventory.reservedStock ?? inventory.reserved_stock ?? 0,
                lowStockAlert: inventory.lowStockAlert ?? inventory.low_stock_threshold ?? 5,
            });
            setProductSearch(existingVariant?.product?.name || existingVariant?.product_name || "");
            setSelectedProductId(existingVariant?.product?.id || existingVariant?.product_id || null);
            setVariants(existingVariant ? [{
                id: existingVariant.id || inventory.variant_id,
                variant_name: existingVariant.variant_name || existingVariant.name || `Variant #${inventory.variant_id}`,
            }] : []);
            return;
        }

        setForm({ ...EMPTY_INVENTORY, warehouseId: selectedWarehouseId || "" });
        setProductSearch("");
        setSelectedProductId(null);
        setVariants([]);
    }, [inventory, open, selectedWarehouseId]);

    // useEffect(() => {
    //     const searchTerm = productSearch.trim();
    //     if (!searchTerm || selectedProductId) {
    //         // setProducts([]);
    //         return;
    //     }

    //     let isActive = true;
    //     const searchTimeout = setTimeout(async () => {
    //         setIsSearchingProducts(true);
    //         setSelectionError("");
    //         try {
    //             const response = await ProductApi.searchVariants(searchTerm);
    //             if (isActive) setProducts(getApiList(response, "products"));
    //         } catch {
    //             if (isActive) setSelectionError("Unable to search products. Please try again.");
    //         } finally {
    //             if (isActive) setIsSearchingProducts(false);
    //         }
    //     }, 300);

    //     return () => {
    //         isActive = false;
    //         clearTimeout(searchTimeout);
    //     };
    // }, [productSearch, selectedProductId]);

    const handleProductSelect = async (product) => {
        console.log("handle product",product);
        // setProductSearch(product.name);
        setSelectedProductId(product.id);
        setVariantIds(product.variantIds);
        // setProducts([]);
        // setVariants([]);
        setSelectionError("");
        setForm((prev) => ({ ...prev, variantId: "" }));

        // if (!Array.isArray(product.variantIds) || product.variantIds.length === 0) {
        //     setSelectionError("This product does not have any variants.");
        //     return;
        // }

        // setIsLoadingVariants(true);
        // try {
        //     const response = await VariantApi.variantsInfo(product.variantIds);
        //     setVariants(getApiList(response, "variants"));
        // } catch {
        //     setSelectionError("Unable to load variants for this product. Please try again.");
        // } finally {
        //     setIsLoadingVariants(false);
        // }
        
    };

    if (!open) {
        return null;
    }

    const onChangeField = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: ["variantId", "warehouseId"].includes(name) ? value : parseInt(value) || 0
        }));
    };

    const onSubmit = (event) => {
        event.preventDefault();
        const { warehouseId, ...inventoryFields } = form;
        onSave({
           
            variant_id: parseInt(form.variantId),
            warehouse_id: parseInt(warehouseId),
            current_stock: parseInt(form.stock),
            reserved_stock: parseInt(form.reservedStock),
            low_stock_threshold: parseInt(form.lowStockAlert)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
            <div
                className="mx-4 w-full max-w-lg rounded-xl border border-border bg-white shadow-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-7">
                    <h2 className="font-display text-lg font-semibold text-foreground">
                        {isEditMode ? "Edit Inventory" : "Add Inventory"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-6">
                    <div>
                        <label className="text-sm font-medium text-foreground" htmlFor="product-search">
                            Product
                        </label>
                        {/* <div className="relative mt-1">
                            <input
                                id="product-search"
                                type="search"
                                value={productSearch}
                                onChange={(event) => {
                                    setProductSearch(event.target.value);
                                    setSelectedProductId(null);
                                    setVariants([]);
                                    setForm((prev) => ({ ...prev, variantId: "" }));
                                }}
                                placeholder="Type a product name, e.g. potato"
                                autoComplete="off"
                                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                            />
                            {products.length > 0 && (
                                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
                                    {products.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleProductSelect(product)}
                                            className="flex w-full flex-col px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                                        >
                                            <span className="font-medium text-foreground">{product.name}</span>
                                            <span className="text-xs text-muted-foreground">{product.variantIds?.length || 0} variant(s)</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {isSearchingProducts && <p className="mt-1 text-xs text-muted-foreground">Searching products...</p>} */}

                        <SearchableSelector
                        data={searchedProduct?.data}
                        onSearchChange={(q)=>setProductSearch(q)}
                        onSelect={(id,item)=>{handleProductSelect(item)}}
                        placeholder="search products"
                        value={selectedProductId}
                        serverSearch={true}
                        disabled={selectedProductId?true:false}
                        />
                    </div>

                   {!inventory && (
                     <div>
                        <label className="text-sm font-medium text-foreground" htmlFor="variant-id">
                            Variant
                        </label>
                        <select
                            id="variant-id"
                            name="variantId"
                            value={form.variantId}
                            onChange={onChangeField}
                            required
                            disabled={isLoadingVariants || variants.length === 0}
                            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                        >
                            <option value="">{isLoadingVariants ? "Loading variants..." : "Select a variant"}</option>
                            {variantInfo?.data?.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                    {variant.variant_name || variant.name || `Variant #${variant.id}`}
                                </option>
                            ))}
                        </select>
                        {selectionError && <p className="mt-1 text-xs text-destructive">{selectionError}</p>}
                    </div>
                   )}

                    {!inventory && (
                        <div>
                        <label className="text-sm font-medium text-foreground" htmlFor="warehouse-id">
                            Warehouse
                        </label>
                        <select
                            id="warehouse-id"
                            name="warehouseId"
                            value={form.warehouseId}
                            onChange={onChangeField}
                            required
                            disabled={isWarehousesLoading}
                            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                        >
                            <option value="">{isWarehousesLoading ? "Loading warehouses..." : "Select a warehouse"}</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground" htmlFor="stock">
                                Current Stock
                            </label>
                            <input
                                id="stock"
                                name="stock"
                                type="number"
                                value={form.stock}
                                onChange={onChangeField}
                                required
                                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground" htmlFor="reserved-stock">
                                Reserved Stock
                            </label>
                            <input
                                id="reserved-stock"
                                name="reservedStock"
                                type="number"
                                value={form.reservedStock}
                                onChange={onChangeField}
                                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground" htmlFor="low-stock-alert">
                            Low Stock Alert Threshold
                        </label>
                        <input
                            id="low-stock-alert"
                            name="lowStockAlert"
                            type="number"
                            value={form.lowStockAlert}
                            onChange={onChangeField}
                            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                            placeholder="5"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                        >
                            {isEditMode ? "Save Changes" : "Create Inventory"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryModal;
