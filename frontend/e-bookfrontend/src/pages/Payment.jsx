import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import UserNavbar from "./UserNavbar";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

export default function Payment() {
  const { plan } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Premium";
  const price = planName === "Basic" ? "₹159" : "₹199";

  const [loading, setLoading] = useState(false);  
  const [success, setSuccess] = useState(false);

  // Load Razorpay script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Create order on basic
      const { data: orderData } = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        { plan: planName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!orderData.success) {
        alert("Failed to initialize payment. Try again.");
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Check Out
      const options = {
        key: orderData.keyId, 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "BookFlix Premium",
        description: `Upgrade to ${planName} Plan`,
        image: "https://ui-avatars.com/api/?name=BookFlix&background=0D8ABC&color=fff",
        order_id: orderData.orderId, 
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await axios.post(
              "http://localhost:5000/api/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planName,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              setSuccess(true);
              setTimeout(() => {
                navigate("/user", { replace: true });
              }, 2000);
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: localStorage.getItem("name") || "",
          email: localStorage.getItem("email") || "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp1 = new window.Razorpay(options);
      
      rzp1.on('payment.failed', function (response){
        console.error(response.error);
        alert(`Payment Failed: ${response.error.description || "Unknown error"}`);
      });

      rzp1.open();
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Could not open payment gateway. Please make sure the backend is running.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 flex-col py-10">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 text-lg">Thank you for subscribing to {planName}. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <UserNavbar />
      
      <div className="flex-1 flex justify-center items-center p-6 pb-20 overflow-y-auto">
        
        <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100 mt-10">
          
          {/* Order Summary Sidebar */}
          <div className="w-full md:w-1/3 bg-gray-900 p-10 text-white relative flex flex-col justify-between">
            <div>
              <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-10 transition flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              
              <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Order Summary</h3>
              <h2 className="text-3xl font-black mb-6">{planName} Plan</h2>
              
              <div className="flex justify-between items-end border-b border-gray-800 pb-6 mb-6">
                <span className="text-gray-400 font-medium">Billed Monthly</span>
                <span className="text-3xl font-black">{price}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-400 font-medium">
                <span>Tax</span>
                <span>₹50</span>
              </div>
              <div className="flex justify-between items-center mt-4 text-white text-xl font-black">
                <span>Total</span>
                <span>{price}</span>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-800 flex items-center gap-3 text-gray-400 text-sm font-medium">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              Secure 256-bit SSL encryption
            </div>
          </div>

          {/* Payment Form */}
          <div className="w-full md:w-2/3 p-10 md:p-14">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-600" /> Secure Checkout
            </h2>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">Almost there!</h3>
              <p className="text-indigo-700 font-medium">
                You will be securely redirected to the official Razorpay gateway to complete your payment via UPI, Card, or Netbanking.
              </p>
            </div>

            <button 
              onClick={handlePayment} 
              disabled={loading}
              className="w-full mt-4 py-4 rounded-xl font-black text-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex justify-center items-center shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : `Pay ${price} Securely`}
            </button>
            <p className="text-center text-gray-400 text-sm mt-4 font-medium flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Secured by Razorpay
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
