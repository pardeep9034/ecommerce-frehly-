import api from "./axiosInstance";

const OrderApi = {
  async fetchMyOrders() {
    const response=await api.get("/orders");
    return response.data;
    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve({
    //       success: true,
    //       data: [
    //         {
    //           id: "ORD-2024-001",
    //           date: "2024-03-20T10:30:00Z",
    //           status: "Delivered",
    //           total: 1250,
    //           items: [
    //             {
    //               id: 1,
    //               name: "Organic Spinach",
    //               quantity: 2,
    //               price: 120,
    //               image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=200&auto=format&fit=crop"
    //             },
    //             {
    //               id: 2,
    //               name: "Fresh Red Tomatoes",
    //               quantity: 1,
    //               price: 80,
    //               image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200&auto=format&fit=crop"
    //             }
    //           ]
    //         },
    //         {
    //           id: "ORD-2024-002",
    //           date: "2024-03-15T14:45:00Z",
    //           status: "Shipped",
    //           total: 850,
    //           items: [
    //             {
    //               id: 3,
    //               name: "Sweet Corn",
    //               quantity: 5,
    //               price: 40,
    //               image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=200&auto=format&fit=crop"
    //             }
    //           ]
    //         },
    //         {
    //           id: "ORD-2024-003",
    //           date: "2024-03-10T09:15:00Z",
    //           status: "Cancelled",
    //           total: 450,
    //           items: [
    //             {
    //               id: 4,
    //               name: "Broccoli",
    //               quantity: 1,
    //               price: 150,
    //               image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=200&auto=format&fit=crop"
    //             }
    //           ]
    //         }
    //       ]
    //     });
    //   }, 1000);
    // });
  },

  async fetchOrderById(id) {
    const response=await api.get(`/orders/${id}`)
    return response.data;
  },
  async fetchAllOrders(page = 1, limit = 10, status, search) {
    const response = await api.get("/orders/admin/all", { params: { page, limit, status, search } });
    return response.data;
  },
  async placeOrder(data){
const response=await api.post("/orders",data)
return response.data
  },
  async updateOrderItemStatus(orderId, itemId, payload) {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/status`, payload);
    return response.data;
  },
  async finalizeOrderItems(orderId) {
    const response = await api.post(`/orders/${orderId}/items/finalize`);
    return response.data;
  },
  async confirmPartialOrder(orderId, decision) {
    const response = await api.post(`/orders/${orderId}/confirm-partial`, { decision });
    return response.data;
  },
  async retryPayment(orderId, payload = {}) {
    const response = await api.post(`/orders/${orderId}/payment/retry`, payload);
    return response.data;
  }
};

export default OrderApi;
