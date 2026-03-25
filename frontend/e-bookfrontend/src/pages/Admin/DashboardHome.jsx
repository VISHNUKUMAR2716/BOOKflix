import { useEffect, useState } from "react";
import axios from "axios";

import {
  Book,
  Heart,
  Calendar,
  Zap,
  CheckCircle,
  Shield
} from "lucide-react";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "http://localhost:5000/api/books/admin/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6 md:p-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between flex-wrap gap-4">

          <div>
            <div className="inline-flex items-center gap-2 bg-white border shadow-sm rounded-xl px-4 py-2 mb-3">
              <Shield size={18} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600 tracking-widest uppercase">
                Admin Dashboard
              </span>
            </div>

            <h1 className="text-4xl font-extrabold text-gray-800">
              Welcome Back{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin
              </span>
            </h1>

            <p className="text-gray-500 mt-2">
              Monitor your platform activity and manage books efficiently.
            </p>
          </div>

          {/* Date */}
          <div className="bg-white shadow-md rounded-xl px-4 py-3 text-sm text-gray-600 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            {new Date().toLocaleDateString()}
          </div>

        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">

        {/* Books */}
        <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden border">

          <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-100 rounded-full group-hover:scale-110 transition"></div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase">
                Total Books
              </p>

              <h2 className="text-4xl font-extrabold text-blue-600 mt-1">
                {stats.totalBooks}
              </h2>
            </div>

            <div className="bg-blue-100 p-3 rounded-xl">
              <Book size={24} className="text-blue-600" />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Total number of books available in the platform library.
          </p>

          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
        </div>


        {/* Likes */}
        <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 overflow-hidden border">

          <div className="absolute -right-6 -top-6 w-28 h-28 bg-rose-100 rounded-full group-hover:scale-110 transition"></div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase">
                Total Likes
              </p>

              <h2 className="text-4xl font-extrabold text-rose-500 mt-1">
                {stats.totalLikes}
              </h2>
            </div>

            <div className="bg-rose-100 p-3 rounded-xl">
              <Heart size={24} className="text-rose-500" />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Total likes received across all books.
          </p>

          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-rose-400 to-pink-500"></div>
        </div>


        {/* System Status */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">

          <div>
            <p className="text-sm opacity-80">Admin Status</p>

            <h2 className="text-2xl font-bold mt-1">
              System Running Smoothly
            </h2>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm opacity-90">
              All services operational
            </span>

            <span className="bg-white/20 px-3 py-1 rounded-full text-xs flex items-center gap-1">
              <CheckCircle size={16} />
              Active
            </span>
          </div>

        </div>

      </div>


      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border p-6">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap size={18} className="text-indigo-600" />
            Quick Actions
          </h2>
        </div>

        <div className="flex flex-wrap gap-4">

          <a
            href="/admin/books"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow hover:scale-105 hover:shadow-xl transition"
          >
            <Book size={18} />
            Manage Books
          </a>

        </div>

      </div>

    </div>
  );
}