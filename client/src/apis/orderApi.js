import api from "./axiosInstance";

const OrderApi = {
  async fetchMyOrders() {
    // Simulating an API call with mock data
    // In a real scenario, this would be: 
    // const response = await api.get("/orders/my-orders");
    // return response.data;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            {
              id: "ORD-2024-001",
              date: "2024-03-20T10:30:00Z",
              status: "Delivered",
              total: 1250,
              items: [
                {
                  id: 1,
                  name: "Organic Spinach",
                  quantity: 2,
                  price: 120,
                  image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=200&auto=format&fit=crop"
                },
                {
                  id: 2,
                  name: "Fresh Red Tomatoes",
                  quantity: 1,
                  price: 80,
                  image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200&auto=format&fit=crop"
                }
              ]
            },
            {
              id: "ORD-2024-002",
              date: "2024-03-15T14:45:00Z",
              status: "Shipped",
              total: 850,
              items: [
                {
                  id: 3,
                  name: "Sweet Corn",
                  quantity: 5,
                  price: 40,
                  image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=200&auto=format&fit=crop"
                }
              ]
            },
            {
              id: "ORD-2024-003",
              date: "2024-03-10T09:15:00Z",
              status: "Cancelled",
              total: 450,
              items: [
                {
                  id: 4,
                  name: "Broccoli",
                  quantity: 1,
                  price: 150,
                  image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=200&auto=format&fit=crop"
                }
              ]
            }
          ]
        });
      }, 1000);
    });
  },

  async fetchOrderById(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: id || "ORD-2024-001",
            date: "2024-03-20T10:30:00Z",
            status: "Delivered",
            paymentMethod: "UPI (PhonePe)",
            paymentStatus: "Paid",
            shippingAddress: {
              name: "Pardeep Kumar",
              street: "123, Green Valley, Phase 2",
              city: "Chandigarh",
              state: "Punjab",
              pincode: "160001",
              phone: "+91 98765 43210"
            },
            statusSteps: [
              { label: "Order Placed", date: "2024-03-20 10:30 AM", status: "completed" },
              { label: "Confirmed", date: "2024-03-20 11:00 AM", status: "completed" },
              { label: "Shipped", date: "2024-03-21 09:00 AM", status: "completed" },
              { label: "Out for Delivery", date: "2024-03-22 10:00 AM", status: "completed" },
              { label: "Delivered", date: "2024-03-22 02:30 PM", status: "completed" }
            ],
            priceBreakdown: {
              mrp: 1450,
              discount: 300,
              delivery: 50,
              gst: 50,
              total: 1250
            },
            items: [
              {
                id: 1,
                name: "Organic Baby Spinach",
                quantity: 2,
                price: 120,
                unit: "250g",
                image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=200&auto=format&fit=crop"
              },
              {
                id: 2,
                name: "Fresh Red Tomatoes",
                quantity: 1,
                price: 80,
                unit: "1kg",
                image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200&auto=format&fit=crop"
              }
            ]
          }
        });
      }, 1000);
    });
  }
};

export default OrderApi;
