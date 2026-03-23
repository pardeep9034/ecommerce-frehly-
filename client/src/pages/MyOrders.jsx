import React from "react";
import { 
  Package, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ShoppingBag,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import useOrder from "../hooks/use-order";

const MyOrders = () => {
  const { orders, isLoading, isError } = useOrder();

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle2 className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6 h-48 animate-pulse rounded-xl bg-white shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb] p-4 text-center">
        <XCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Failed to load orders</h2>
        <p className="mt-2 text-gray-600">Please try again later.</p>
        <Link to="/shop" className="mt-6 font-medium text-[#0f5132] hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1f2937]">
              My Orders
            </h1>
            <p className="mt-1 text-gray-500">
              Check the status of your recent orders and manage them.
            </p>
          </div>
          <Link 
            to="/shop" 
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Order Header */}
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order ID</p>
                        <p className="text-sm font-bold text-gray-900">{order.id}</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-100">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                          <p className="mt-0.5 text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0f5132]">₹{item.price * item.quantity}</p>
                          <p className="text-[10px] text-gray-400">₹{item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="border-t border-gray-50 bg-gray-50/30 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Order Total</p>
                      <p className="text-lg font-extrabold text-[#0f5132]">₹{order.total}</p>
                    </div>
                    <Link 
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0f5132] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0b4128]"
                    >
                      Order Details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-6 text-gray-400">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No orders found</h3>
            <p className="mt-2 text-gray-500">
              You haven't placed any orders yet. Start shopping to fill your list!
            </p>
            <Link 
              to="/shop" 
              className="mt-8 rounded-xl bg-[#0f5132] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#0f5132]/20 transition-all hover:scale-105 hover:bg-[#0b4128]"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
