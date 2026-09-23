// Opens Razorpay's Checkout modal in place (no redirect). `onDone` fires
// after the modal closes for ANY reason — paid, dismissed, or failed —
// because none of those mean the order is confirmed: the actual
// confirmation comes later from the backend's signature-verified webhook.
// This just moves the UI on to where that result will show up.
export function openRazorpayCheckout({ paymentSession, profile, onDone }) {
  if (!window.Razorpay) {
    onDone();
    return;
  }

  const razorpay = new window.Razorpay({
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: Math.round(paymentSession.amount * 100),
    currency: "INR",
    name: "Freshly",
    order_id: paymentSession.provider_session_id,
    prefill: {
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
      email: profile?.email,
      contact: profile?.phone
    },
    handler: onDone,
    modal: { ondismiss: onDone }
  });

  razorpay.on("payment.failed", onDone);
  razorpay.open();
}
