import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Download, TrendingUp, Eye, Heart } from "lucide-react";

const Analytics = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooksForAnalytics = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/books");
        setBooks(res.data || []);
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooksForAnalytics();
  }, []);

  // Prepare chart data (top 10 books by views/likes to avoid crowded graphs)
  const chartData = books
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map((b) => ({
      name: b.title.length > 15 ? b.title.substring(0, 15) + "..." : b.title,
      Views: b.views || 0,
      Likes: b.likes?.length || 0,
    }));

  // Top books list
  const topViewedBooks = books
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const totalViews = books.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalLikes = books.reduce((sum, b) => sum + (b.likes?.length || 0), 0);

  // CSV Export
  const downloadReport = () => {
    const headers = "Serial,Book Title,Author,Views,Likes,Downloads\n";
    const rows = books.map((b, i) => 
      `${i + 1},"${b.title}",${b.author},${b.views || 0},${b.likes?.length || 0},${b.downloads || 0}`
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Book_Analytics_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics Dashboard</h2>
          <p className="text-gray-500 mt-1">Track your library's performance and engagement.</p>
        </div>
        <button 
          onClick={downloadReport}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md transition transform hover:scale-105"
        >
          <Download className="w-5 h-5" /> Download Report (CSV)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
               <div className="bg-green-100 p-4 rounded-xl text-green-600">
                 <Eye className="w-8 h-8" />
               </div>
               <div>
                  <p className="text-gray-500 text-sm font-semibold uppercase">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900">{totalViews}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
               <div className="bg-red-100 p-4 rounded-xl text-red-500">
                 <Heart className="w-8 h-8" />
               </div>
               <div>
                  <p className="text-gray-500 text-sm font-semibold uppercase">Total Likes</p>
                  <p className="text-3xl font-bold text-gray-900">{totalLikes}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
               <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                 <TrendingUp className="w-8 h-8" />
               </div>
               <div>
                  <p className="text-gray-500 text-sm font-semibold uppercase">Total Books</p>
                  <p className="text-3xl font-bold text-gray-900">{books.length}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Engagement Overview (Top 10 Books)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Views" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Likes" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Viewed Books List */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <TrendingUp className="text-indigo-500" /> Top Viewed Books
              </h3>
              <div className="space-y-6">
                {topViewedBooks.map((book, index) => (
                  <div key={book._id} className="flex items-center gap-4">
                    <div className="text-xl font-black text-gray-300 w-6">#{index + 1}</div>
                    <img 
                      src={`http://localhost:5000/uploads/${book.thumbnail}`} 
                      alt={book.title} 
                      className="w-12 h-16 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">{book.title}</h4>
                      <p className="text-xs text-gray-500">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-600 text-sm">{book.views || 0}</div>
                      <div className="text-xs text-gray-400">views</div>
                    </div>
                  </div>
                ))}
                
                {topViewedBooks.length === 0 && (
                  <p className="text-gray-500 text-sm">No data available yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
