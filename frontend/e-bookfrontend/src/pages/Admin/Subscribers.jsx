import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscribers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-8">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          💎 Active Subscriptions
        </h1>
        <p className="text-gray-500">
          View all members with active subscription plans.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-600">User</th>
                <th className="px-6 py-4 font-bold text-gray-600">Plan</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Started</th>
                <th className="px-6 py-4 text-center font-bold text-gray-600">Ends On</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500 font-medium">
                    No active subscribers found.
                  </td>
                </tr>
              ) : (
                subscribers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://bookflix-1-o3od.onrender.com/uploads/${user.photo}`} 
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}` }}
                          className="w-10 h-10 rounded-full object-cover bg-gray-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        user.subscription.plan === 'Premium' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.subscription.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 font-medium">
                      {user.subscription.startDate ? format(new Date(user.subscription.startDate), "MMM dd, yyyy") : "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 font-medium">
                      {user.subscription.endDate ? format(new Date(user.subscription.endDate), "MMM dd, yyyy") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
