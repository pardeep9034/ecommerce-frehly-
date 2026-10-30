// Run: node cartRules.check.js   (no database, no running service)
import assert from "node:assert/strict";
import { assertOnSale, availableStock } from "./src/modules/addToCart/cartRules.js";

// on sale: ACTIVE variant of an ACTIVE product, as GET /product-variant/variants/:id returns it
const variant = (status, productStatus) => ({ id: "3", status, product: { id: "1", name: "Milk", status: productStatus } });
const notOnSale = (v) => assert.throws(() => assertOnSale(v), (error) => error.statusCode === 409 && /not on sale/.test(error.message));

assertOnSale(variant("ACTIVE", "ACTIVE"));
for (const status of ["INACTIVE", "ARCHIVED"]) notOnSale(variant(status, "ACTIVE"));
for (const status of ["DRAFT", "INACTIVE", "ARCHIVED"]) notOnSale(variant("ACTIVE", status));
notOnSale({ id: "3", status: "ACTIVE" }); // no product attached
notOnSale(undefined);

// available = current_stock - reserved_stock (values may arrive as strings)
assert.equal(availableStock({ current_stock: 10, reserved_stock: 4 }), 6);
assert.equal(availableStock({ current_stock: "10", reserved_stock: "10" }), 0);
assert.equal(availableStock({ current_stock: 5, reserved_stock: null }), 5);
assert.equal(availableStock({ current_stock: 5 }), 5);
assert.equal(availableStock(undefined), 0, "no inventory row means nothing to sell");

console.log("cartRules.check: all assertions passed");
