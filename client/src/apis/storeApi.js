import api from "./axiosInstance";

// The existing order-service and delivery-service routes. For OPS_STAFF the server limits
// every call to the store in the caller's JWT; admins name the store where a call needs one.
const StoreApi = {
  async getOrder(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
  // payload: { status: "READY" | "NOT_AVAILABLE", remarks }
  async updateItemStatus(orderId, itemId, payload) {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/status`, payload);
    return response.data;
  },
  async finalizeItems(orderId) {
    const response = await api.post(`/orders/${orderId}/items/finalize`);
    return response.data;
  },
  async packOrder(orderId, payload) {
    // payload: { bag_count, rack_label }
    const response = await api.post(`/orders/${orderId}/pack`, payload);
    return response.data;
  },
  // Online riders in the store's zone with room for one more, nearest first. Store staff
  // always get their own store; the header only matters for an admin.
  async getAvailableRiders(warehouseId) {
    const response = await api.get("/delivery-partners", { headers: { "x-warehouse-id": warehouseId } });
    return response.data;
  },
  async assignRider(orderId, deliveryPartnerId) {
    const response = await api.post("/handle-orders/assignments/assign", {
      order_id: orderId,
      delivery_partner_id: deliveryPartnerId,
      assignment_source: "MANUAL",
    });
    return response.data;
  },
  // Who holds an order: { assignment_id, partner: { name, phone } }, or null.
  async getAssignment(orderId) {
    const response = await api.get(`/handle-orders/assignments/by-order/${orderId}`);
    return response.data;
  },
  // The rider has the bags: the order moves to PICKED_UP. pickupCode is the 4 digits the rider's app shows; the server checks it.
  async confirmHandover(assignmentId, pickupCode) {
    const response = await api.post(`/handle-orders/assignments/${assignmentId}/update-status`, { status: "PICKED_UP", pickup_code: pickupCode });
    return response.data;
  },
  // Riders who still hold goods owed to the store: a failed drop, or items turned away at the door.
  async getReturnsDue() {
    const response = await api.get("/handle-orders/returns-due");
    return response.data;
  },
  // returnCode: the 4 digits on the rider's Home screen; the server checks it.
  async receiveReturn(assignmentId, returnCode) {
    const response = await api.post(`/handle-orders/assignments/${assignmentId}/returned`, { return_code: returnCode });
    return response.data;
  },
  // The rider's photo of what was turned away, as an object URL for an <img>. The caller revokes it.
  async getDoorPhotoUrl(assignmentId) {
    const response = await api.get(`/handle-orders/assignments/${assignmentId}/door-photo`, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
  // A rider sent to collect an order's approved customer returns.
  async assignPickup(orderId, deliveryPartnerId) {
    const response = await api.post("/handle-orders/assignments/assign-pickup", { order_id: orderId, delivery_partner_id: deliveryPartnerId });
    return response.data;
  },
  // decision APPROVE ({ pickup, sent_variant_id? }) or REJECT ({ reject_reason }).
  async reviewReturn(orderId, returnId, body) {
    const response = await api.patch(`/orders/${orderId}/returns/${returnId}/review`, body);
    return response.data;
  },
  // The customer's photo, as an object URL for an <img>. The caller revokes it.
  async getReturnPhotoUrl(orderId, returnId) {
    const response = await api.get(`/orders/${orderId}/returns/${returnId}/photo`, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
  // Variants whose product name matches: { rows: [{ id, product: { name } }] }. For "which item was actually sent".
  async searchVariants(search) {
    const response = await api.get("/product-variant/variants/search", { params: { search } });
    return response.data;
  },
  // Return lines by status ("REQUESTED", "APPROVED", "IN_TRANSIT", "RECEIVED", "CLOSED"; comma-separated).
  // warehouseId: admins only; store staff always get their own store.
  async getReturns(status, warehouseId) {
    const response = await api.get("/orders/returns", { params: { status, warehouse_id: warehouseId || undefined } });
    return response.data;
  },
  // items: [{ return_id, restock_qty, write_off_qty }], each line's quantity split in two.
  async inspectReturns(orderId, items) {
    const response = await api.patch(`/orders/${orderId}/returns/inspect`, { items });
    return response.data;
  },
  // A failed order back at the store: cancelled and refunded. items: [{ order_item_id, restock_qty, write_off_qty }].
  async cancelReturned(orderId, items, reason) {
    const response = await api.patch(`/orders/${orderId}/cancel`, { reason, cancelled_by: "ADMIN", items });
    return response.data;
  },
};

export default StoreApi;
