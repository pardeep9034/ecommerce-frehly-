import React, { useState, useMemo } from "react";
import { Minus, Plus, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeFromCart, updateQuantity } from "@/redux/cartSlice";
import useProduct from "@/hooks/use-product";
import useVariant from "@/hooks/use-variant";
import useInventory from "@/hooks/use-inventory";
import {
  useAddToCartMutation,
  increaseQuantityMutation,
  decreaseQuantityMutation,
} from "@/hooks/use-addToCart";

// Same markup on every screen; only sizes change at lg (design B).
const ShopProductCard = ({ product }) => {
  const { id, name, price, oldPrice, image } = product.Product || product;
  const dispatch = useDispatch();
  const addToCartMutation = useAddToCartMutation();
  const increaseMutation = increaseQuantityMutation();
  const decreaseMutation = decreaseQuantityMutation();

  // Parent (Shop.jsx) may already pass merged variants annotated with `in_stock`.
  // When it hasn't (e.g. ShopProductDetail's related-products strip), self-fetch.
  const preloadedVariants =
    Array.isArray(product.variants) && product.variants.every((v) => "in_stock" in v)
      ? product.variants
      : null;

  const fallbackProductId = preloadedVariants ? null : product?.id;
  const { productById } = useProduct({ id: fallbackProductId });
  const fallbackVariantIds = preloadedVariants
    ? []
    : (productById?.data?.variants || []).map((v) => v.id);
  const { variantInfo } = useVariant({ variantIds: fallbackVariantIds });
  const { inStockVariantIds } = useInventory(undefined, undefined, undefined, fallbackVariantIds);

  const variantData = useMemo(() => {
    if (preloadedVariants) return preloadedVariants.filter((v) => v.in_stock);
    const all = variantInfo || [];
    if (!inStockVariantIds) return all; // not resolved yet, show unfiltered rather than flash empty
    const inStockSet = new Set(inStockVariantIds.map(Number));
    return all.filter((v) => inStockSet.has(Number(v.id)));
  }, [preloadedVariants, variantInfo, inStockVariantIds]);

  const totalVariantCount = preloadedVariants
    ? preloadedVariants.length
    : (productById?.data?.variants?.length || 0);
  const isOutOfStock = totalVariantCount > 0 && variantData.length === 0;

  // Out-of-stock products still show their first pack's price.
  const shownVariants = isOutOfStock ? (preloadedVariants || variantInfo || []) : variantData;
  const [pickedIndex, setSelectedIndex] = useState(0);
  const selectedIndex = shownVariants[pickedIndex] ? pickedIndex : 0;
  const selectedVariant = shownVariants[selectedIndex] || {};

  const currentPrice = Number(selectedVariant.price || price || 0);
  const currentMrp = Number(selectedVariant.mrp || oldPrice || 0);
  const discount = currentMrp > currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  const cartItem = useSelector((state) =>
    state.cart.items.find(
      (item) => item.product_id === id && item.variant_id === selectedVariant.id
    )
  );

  const handleAddToCart = () => {
    if (isOutOfStock || !selectedVariant?.id) return;
    addToCartMutation.mutate(
      { variant_id: selectedVariant.id, quantity: 1 },
      {
        onSuccess: (response) => {
          const added = response?.data?.data;
          dispatch(
            addToCart({
              id: added?.id,
              cart_id: added?.cart_id,
              product_id: id,
              variant_id: selectedVariant.id,
              product_name: name,
              image,
              variant_name: selectedVariant.variant_name,
              quantity: 1,
              price: currentPrice,
            })
          );
        },
      }
    );
  };

  // Same steps as CartPage; the server drops the item when it reaches 0.
  const changeQuantity = (delta) => {
    const keys = { product_id: cartItem.product_id, variant_id: cartItem.variant_id };
    if (delta > 0) {
      dispatch(updateQuantity({ ...keys, quantity: cartItem.quantity + 1 }));
      increaseMutation.mutate({ cartItemId: cartItem.id });
    } else {
      if (cartItem.quantity <= 1) dispatch(removeFromCart(keys));
      else dispatch(updateQuantity({ ...keys, quantity: cartItem.quantity - 1 }));
      decreaseMutation.mutate({ cartItemId: cartItem.id });
    }
  };

  return (
    <div className="relative flex h-full flex-col rounded-xl border border-border bg-white p-2.5 lg:rounded-2xl lg:p-3">
      {discount > 0 && !isOutOfStock && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-accent-foreground lg:text-[11px]">
          {discount}% OFF
        </span>
      )}

      <Link
        to={`/products/${id}`}
        className="relative flex h-[120px] items-center justify-center overflow-hidden rounded-lg bg-muted lg:h-[150px]"
      >
        <ShoppingBasket className="h-10 w-10 text-muted-foreground/40" />
        {image && (
          <img
            src={image}
            alt={name}
            loading="lazy"
            onError={(e) => e.currentTarget.remove()}
            className={`absolute inset-0 h-full w-full bg-muted object-contain p-2 ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
          />
        )}
        {isOutOfStock && (
          <span className="absolute rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase text-white">
            Out of stock
          </span>
        )}
      </Link>

      <Link
        to={`/products/${id}`}
        className="mt-2 line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-foreground hover:text-primary lg:text-sm"
      >
        {name}
      </Link>

      {shownVariants.length > 1 && !isOutOfStock ? (
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          aria-label={`Pack size for ${name}`}
          className="mt-1.5 w-full rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-muted-foreground outline-none focus:border-primary"
        >
          {shownVariants.map((v, index) => (
            <option key={v.id ?? index} value={index}>
              {v.variant_name}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-1.5 px-0.5 py-1 text-xs font-medium text-muted-foreground">
          {selectedVariant.variant_name || " "}
        </p>
      )}

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[15px] font-extrabold text-foreground lg:text-base">₹{currentPrice}</span>
        {currentMrp > currentPrice && (
          <span className="text-xs text-muted-foreground line-through">₹{currentMrp}</span>
        )}
      </div>

      <div className="mt-auto pt-2">
        {isOutOfStock ? (
          <button
            disabled
            className="h-9 w-full rounded-lg border border-border text-xs font-bold text-muted-foreground"
          >
            Out of stock
          </button>
        ) : cartItem ? (
          <div className="flex h-9 w-full items-center justify-between rounded-lg bg-primary text-white">
            <button
              onClick={() => changeQuantity(-1)}
              aria-label={`Remove one ${name}`}
              className="flex h-full w-10 items-center justify-center"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold" aria-live="polite">{cartItem.quantity}</span>
            <button
              onClick={() => changeQuantity(1)}
              aria-label={`Add one more ${name}`}
              className="flex h-full w-10 items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || !selectedVariant.id}
            className="h-9 w-full rounded-lg border-[1.5px] border-primary bg-primary/10 text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
          >
            ADD
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopProductCard;
