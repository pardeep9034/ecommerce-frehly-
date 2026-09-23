import React from "react";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  Receipt,
  Download,
  ShoppingCart
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useOrderDetail, useConfirmPartialOrder, useRetryPayment } from "@/hooks/use-order";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "@/components/ui/sonner";

const RETRYABLE_STATUSES = ["PENDING_PAYMENT", "PAYMENT_FAILED", "PAYMENT_EXPIRED"];

const OrderDetail = () => {
  const { orderId } = useParams();
  const queryClient = useQueryClient();
  const { order, isLoading, isError } = useOrderDetail(orderId);
  const confirmPartialOrder = useConfirmPartialOrder(orderId);
  const retryPayment = useRetryPayment(orderId);

  const handleRetryPayment = () => {
    retryPayment.mutate({}, {
      onSuccess: (result) => {
        const { payment_session } = result.data;
        if (payment_session?.provider_session_id) {
          openRazorpayCheckout({
            paymentSession: payment_session,
            onDone: () => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
          });
        }
      },
      onError: () => toast.error("Unable to retry payment, please try again"),
    });
  };

  const handleDownloadInvoice = () => {
    window.print();
  };

  const handleConfirmPartial = (decision) => {
    confirmPartialOrder.mutate(decision, {
      onSuccess: () => {
        toast.success(
          decision === "ACCEPT_PARTIAL"
            ? "Continuing with the available items."
            : "Order cancelled and refunded."
        );
      },
      onError: () => toast.error("Unable to process your choice, please try again"),
    });
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "delivered": return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "shipped": return <Truck className="h-5 w-5 text-blue-500" />;
      case "pending": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "cancelled": return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8 h-8 w-48 skeleton-shimmer rounded" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 skeleton-shimmer rounded-xl shadow-sm" />
              <div className="h-96 skeleton-shimmer rounded-xl shadow-sm" style={{ animationDelay: "120ms" }} />
            </div>
            <div className="h-96 skeleton-shimmer rounded-xl shadow-sm" style={{ animationDelay: "240ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4 text-center">
        <XCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="mt-2 text-gray-600">We couldn't find the details for this order.</p>
        <Link to="/orders" className="mt-6 font-medium text-primary hover:underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-5xl px-4">
        
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/orders" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Order Details</h1>
              <p className="text-sm text-gray-500">Order ID: {order.id}</p>
            </div>
          </div>
          <button 
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 no-print"
          >
            <Download className="h-4 w-4" />
            Invoice
          </button>
        </div>

        {RETRYABLE_STATUSES.includes(order.status) && (
          <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-gray-900">
              <Clock className="h-5 w-5 text-yellow-600" />
              {order.status === "PENDING_PAYMENT" ? "Waiting for payment confirmation" : "Payment didn't go through"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {order.status === "PENDING_PAYMENT"
                ? "If you already paid, this page updates automatically once it's confirmed. Didn't finish paying, or want to try again?"
                : "You can retry payment for this order without re-adding your items."}
            </p>
            <button
              type="button"
              disabled={retryPayment.isPending}
              onClick={handleRetryPayment}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {retryPayment.isPending ? "Starting payment..." : "Retry Payment"}
            </button>
          </div>
        )}

        {order.status === "AWAITING_CUSTOMER_CONFIRMATION" && (
          <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-gray-900">
              <XCircle className="h-5 w-5 text-yellow-600" />
              Some items in your order are unavailable
            </h3>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              {(order.items || [])
                .filter((item) => item.status === "NOT_AVAILABLE")
                .map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold">{item.product_name}</span>
                    {item.admin_remarks ? ` — ${item.admin_remarks}` : ""}
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              You'll be refunded ₹{Number(order.refunded_amount || 0).toFixed(2)} for these. Do you want to continue with the remaining items, or cancel the whole order?
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={confirmPartialOrder.isPending}
                onClick={() => handleConfirmPartial("ACCEPT_PARTIAL")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                Continue with available items
              </button>
              <button
                type="button"
                disabled={confirmPartialOrder.isPending}
                onClick={() => handleConfirmPartial("CANCEL_ORDER")}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel entire order
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Stepper */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <Package className="h-5 w-5 text-primary" />
                  Delivery Status
                </h3>
              </div>
              <div className="p-8">
                <div className="relative">
                  {order.statusHistory.map((step, index) => (
                    <div key={index} className="flex gap-4 pb-8 last:pb-0">
                      <div className="relative flex flex-col items-center">
                         <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                           step.new_status === 'completed' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                         }`}>
                           {step.new_status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                         </div>
                         {index !== order.statusHistory.length - 1 && (
                            <div className={`absolute top-8 h-full w-0.5 ${
                              step.new_status === 'completed' ? 'bg-primary' : 'bg-gray-200'
                            }`} />
                         )}
                      </div>
                      <div className="flex flex-col">
                        <p className={`text-sm font-bold ${step.new_status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.new_status}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(step.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
               <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Order Items ({order.items.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-6 p-6">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <img src={item.image} alt={item.product_name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="font-bold text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-500">Unit: {item.unit}</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">Qty: {Number(item.quantity)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₹{item.line_total}</p>
                      <p className="text-xs text-gray-400">₹{item.selling_price} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            
            {/* Payment Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <Receipt className="h-5 w-5 text-primary" />
                  Order Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bag Total (MRP)</span>
                  <span className="font-medium text-gray-900">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bag Discount</span>
                  <span className="font-medium text-success">-₹{order.discount_amount}</span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (Estimated)</span>
                  <span className="font-medium text-gray-900">₹{order.priceBreakdown.gst}</span>
                </div> */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Charges</span>
                  <span className="font-medium text-gray-900">₹{order.delivery_fee}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between">
                  <span className="text-base font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-extrabold text-primary">₹{order.total_amount}</span>
                </div>
                <div className="mt-4 rounded-lg bg-success p-3 text-center">
                  <p className="text-xs font-bold text-primary">You saved ₹{order.discount_amount} on this order!</p>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <MapPin className="h-5 w-5 text-primary" />
                  Shipping Address
                </h3>
              </div>
              <div className="p-6">
                <p className="font-bold text-gray-900">{order.address.full_name}</p>
                <p className="mt-1 text-sm text-gray-600">{order.address.address_line_1}</p>
                <p className="text-sm text-gray-600">{order.address.city}, {order.address.state} - {order.address.postal_code}</p>
                <p className="mt-3 text-sm font-medium text-gray-900">{order.address.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
               <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Info
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-sm text-gray-500">Method</p>
                   <p className="text-sm font-bold text-gray-900">{order.latest_payment.payment_method}</p>
                </div>
                <div className="flex items-center justify-between">
                   <p className="text-sm text-gray-500">Status</p>
                   <p className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.latest_payment.status === 'Paid' ? 'bg-success text-success' : 'bg-yellow-100 text-yellow-700'}`}>
                     {order.latest_payment.status}
                   </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Hidden Printable Invoice Section */}
      <div className="printable-invoice hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            .printable-invoice, .printable-invoice * { visibility: visible; }
            .printable-invoice { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              padding: 40px;
              color: #000;
              background: #fff;
            }
            .no-print { display: none !important; }
          }
        `}} />
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
          <div>
             <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Freshly</h1>
             <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Organic Food Market</p>
             <div className="mt-4 text-sm">
                <p className="font-bold">Freshly Retail Pvt. Ltd.</p>
                <p>GSTIN: 07AAACF1234A1Z5</p>
                <p>12th Floor, Green Tech Park, Bengaluru-560001</p>
             </div>
          </div>
          <div className="text-right">
             <h2 className="text-2xl font-bold uppercase text-gray-400">Tax Invoice</h2>
             <div className="mt-4 text-sm">
                <p><span className="font-bold">Order ID:</span> {order.id}</p>
                <p><span className="font-bold">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                <p><span className="font-bold">Status:</span> {order.status}</p>
             </div>
          </div>
        </div>

        {/* Billing & Shipping */}
        <div className="grid grid-cols-2 gap-12 mb-10 pb-8 border-b border-gray-100">
          <div>
             <h3 className="text-xs font-bold uppercase text-primary mb-3">Shipping To</h3>
             <p className="font-black text-lg">{order.address.full_name}</p>
             <p className="mt-1 text-gray-700">{order.address.address_line_1}</p>
             <p className="text-gray-700">{order.address.city}, {order.address.state} - {order.address.postal_code}</p>
             <p className="mt-2 font-bold">{order.address.phone}</p>
          </div>
          <div className="text-right flex flex-col items-end">
             <h3 className="text-xs font-bold uppercase text-primary mb-3">Payment Information</h3>
             <p className="font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString().payment_method}</p>
             <p className={`text-xs font-bold mt-1 px-2 py-0.5 rounded ${order.latest_payment.status === 'Paid' ? 'bg-success text-success' : 'bg-yellow-100 text-yellow-700'}`}>
                {order.latest_payment.status}
             </p>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full mb-10">
          <thead>
             <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-left font-bold uppercase text-xs text-gray-500">Item Description</th>
                <th className="py-3 text-left font-bold uppercase text-xs text-gray-500">Unit Price</th>
                <th className="py-3 text-center font-bold uppercase text-xs text-gray-500">Qty</th>
                <th className="py-3 text-right font-bold uppercase text-xs text-gray-500">Total</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 uppercase tracking-tighter font-medium">
             {order.items.map((item) => (
               <tr key={item.id}>
                  <td className="py-5">
                    <p className="font-bold text-gray-900">{item.product_name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.unit}</p>
                  </td>
                  <td className="py-5 font-bold">₹{item.selling_price}</td>
                  <td className="py-5 text-center font-bold">{Number(item.quantity)}</td>
                  <td className="py-5 text-right font-bold">₹{item.line_total}</td>
               </tr>
             ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
           <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bag Total (MRP)</span>
                <span className="font-medium">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bag Discount</span>
                <span className="font-medium text-success">-₹{order.discount_amount}</span>
              </div>
              {/* <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST (Estimated)</span>
                <span className="font-medium">₹{order.priceBreakdown.gst}</span>
              </div> */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Charges</span>
                <span className="font-medium">₹{order.delivery_fee}</span>
              </div>
              <div className="flex justify-between pt-4 border-t-2 border-primary">
                <span className="text-md font-black uppercase text-primary">Grand Total</span>
                <span className="text-xl font-black text-primary">₹{order.total_amount}</span>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-gray-100 text-center">
           <p className="text-[10px] font-bold uppercase text-gray-400">THANK YOU FOR SHOPPING ORGANIC!</p>
           <p className="text-[10px] text-gray-400 mt-1">This is a computer generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
