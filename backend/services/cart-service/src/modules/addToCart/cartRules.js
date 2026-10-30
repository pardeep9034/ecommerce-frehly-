import AppError from "../../utils/AppError.js";

// A customer may only buy an ACTIVE variant of an ACTIVE product.
// variant: data of GET /product-variant/variants/:id ({ status, product: { status } }).
export function assertOnSale(variant) {
  if (variant?.status !== "ACTIVE" || variant?.product?.status !== "ACTIVE") {
    throw new AppError("This item is not on sale", 409);
  }
}

// What the store can still sell: current_stock - reserved_stock (both may arrive as strings).
// inventory: data of GET /inventory/variant/:id for the chosen store.
export function availableStock(inventory) {
  const available = Number(inventory?.current_stock) - Number(inventory?.reserved_stock || 0);
  return Number.isFinite(available) ? available : 0;
}
