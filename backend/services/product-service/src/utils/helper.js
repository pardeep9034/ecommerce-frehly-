import { randomUUID } from "crypto";

export function generateSku() {
  const sku = `FR-${randomUUID().slice(0, 8).toUpperCase()}`;
  return sku;
}