import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Clock, Trash2, CheckCircle, AlertCircle } from "lucide-react";

const ManageUpcoming = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/books", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter for upcoming status
      const upcoming = res.data.filter(b => b.status === "upcoming");
      setBooks(upcoming);
    } catch (error) {
      console.error("Failed to fetch upcoming books:", error);
      setMessage("Failed to load upcoming books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const handleReleaseNow = async (id) => {
    if (!window.confirm("Are you sure you want to release this book immediately?")) return;
    try {
      await axios.put(`https://bookflix-1-o3od.onrender.com/api/admin/books/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Book released successfully!");
      fetchUpcoming();
    } catch (error) {
      setMessage("Failed to release book");
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!window.confirm("Cancel schedule and return to pending?")) return;
    try {
      // Logic would go here to set back to pending
      // For now we'll just alert that it's canceled
      setMessage("Schedule canceled");
    } catch (error) {
      setMessage("Error canceling");
    }
  };

  return (
    <div className="p-8 bg-[#fafafa] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Upcoming Releases</h1>
          <p className="text-gray-500 font-medium">Manage and monitor scheduled book launches.</p>
        </div>
        <div className="bg-purple-100 text-purple-600 px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {books.length} Books Scheduled
        </div>
      </div>

      {message && (
        <div className="mb-6 bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-indigo-500" />
          <p className="text-sm font-bold text-gray-700">{message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
          <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-400">No upcoming releases scheduled.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {books.map((book) => (
            <div key={book._id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex gap-6">
              <div className="w-32 h-44 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                <img 
                  src={`https://bookflix-1-o3od.onrender.com/uploads/${book.thumbnail}`} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">{book.title}</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">{book.author}</p>
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-black">
                    <Calendar className="w-3.5 h-3.5" />
                    Scheduled: {new Date(book.releaseDate).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleReleaseNow(book._id)}
                    className="flex-1 bg-green-50 text-green-600 py-3 rounded-2xl text-xs font-black hover:bg-green-100 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Release Now
                  </button>
                  <button 
                    className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-100 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageUpcoming;
