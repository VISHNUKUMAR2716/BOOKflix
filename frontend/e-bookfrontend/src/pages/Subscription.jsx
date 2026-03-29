import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "./UserNavbar";
import { Check, Star, Shield, Zap } from "lucide-react";
import axios from "axios";

export default function Subscription() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  const [upgrading, setUpgrading] = useState(false);

  // Check if already subscribed
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const handleSelectPlan = async (planName) => {
    setUpgrading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/payment/activate",
        { plan: planName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(res.data.message);
        navigate("/user", { replace: true });
      } else {
        alert("Failed to activate subscription. Please try again.");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("Error upgrading plan. Please make sure the backend is running.");
    } finally {
      setUpgrading(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <UserNavbar />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 pb-40 pt-20 px-6 text-center rounded-bl-[4rem]">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Unlock Unlimited Knowledge
          </h1>
          <p className="text-indigo-100 text-xl max-w-2xl mx-auto leading-relaxed">
            Choose the perfect plan to dive into thousands of premium books and audiobooks without any restrictions.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
          
          {currentUser?.subscription?.status === "active" && (
            <div className="mb-10 block w-full bg-green-50 border border-green-200 text-green-800 rounded-3xl p-6 text-center shadow-sm">
              <span className="text-green-600 text-2xl mb-2 block">🎉</span>
              <h3 className="font-bold text-lg mb-1">You are already subscribed to the {currentUser.subscription.plan} plan!</h3>
              <p className="text-sm">Enjoy your unlimited reading experience. No need to purchase again.</p>
              <button onClick={() => navigate("/user")} className="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition">
                Go to Dashboard
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Basic Plan */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 relative group hover:shadow-2xl transition duration-300">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Basic</h2>
              <p className="text-gray-500 mb-6 border-b border-gray-100 pb-6">Great for casual readers who want more access.</p>
              
              <div className="mb-8">
                <span className="text-5xl font-black text-gray-900">₹159</span>
                <span className="text-gray-500 font-bold">/month</span>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></div>
                  Read up to 10 books per month
                </li>
                <li className="flex items-center gap-3 text-gray-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></div>
                  Standard customer support
                </li>
                <li className="flex items-center gap-3 text-gray-700 font-medium opacity-50">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">✕</div>
                  No Audiobook Access
                </li>
              </ul>

              <button 
                onClick={() => handleSelectPlan("Basic")}
                disabled={upgrading || currentUser?.subscription?.status === "active"}
                className="w-full py-4 rounded-full font-black text-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition disabled:opacity-50"
              >
                {upgrading ? "Upgrading..." : "Choose Basic"}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl relative transform md:-translate-y-4 border border-gray-800">
              <div className="absolute top-0 right-10 transform -translate-y-1/2">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-black uppercase tracking-widest py-2 px-4 rounded-full shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3" /> Most Popular
                </div>
              </div>

              <div className="w-16 h-16 bg-white/10 text-yellow-400 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Premium</h2>
              <p className="text-gray-400 mb-6 border-b border-gray-800 pb-6">For the ultimate bookworms.</p>
              
              <div className="mb-8">
                <span className="text-5xl font-black text-white">₹199</span>
                <span className="text-gray-400 font-bold">/month</span>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-gray-200 font-medium">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></div>
                  Unlimited book reading
                </li>
                <li className="flex items-center gap-3 text-gray-200 font-medium">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></div>
                  Unlimited audiobook listening
                </li>
                <li className="flex items-center gap-3 text-gray-200 font-medium">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></div>
                  Priority 24/7 support
                </li>
              </ul>

              <button 
                onClick={() => handleSelectPlan("Premium")}
                disabled={upgrading || currentUser?.subscription?.status === "active"}
                className="w-full py-4 rounded-full font-black text-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-300 hover:to-yellow-400 transition shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                {upgrading ? "Upgrading..." : "Choose Premium"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
