import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Calendar, Bell, ChevronRight, Clock } from "lucide-react";
import UserNavbar from "./UserNavbar";

const UpcomingBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        // Fetch all books and filter for upcoming
        const res = await axios.get("http://localhost:5000/api/books");
        const upcoming = res.data.filter((b) => b.status === "upcoming");
        setBooks(upcoming);
      } catch (error) {
        console.error("Failed to fetch upcoming books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <UserNavbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* HERO SECTION */}
        <div className="relative mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Calendar className="w-3 h-3" />
              Coming Soon to BookFlix
            </div>
            <h1 className="text-6xl md:text-8xl font-[1000] text-gray-900 tracking-tighter mb-6 leading-none">
              FUTURE <span className="text-purple-600">READS.</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Explore the next generation of bestsellers. Schedule your alerts and be the first to dive into these upcoming masterpieces.
            </p>
          </motion.div>
        </div>

        {/* UPCOMING GRID */}
        {loading ? (
          <div className="flex justify-center py-40">
            <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-400">No upcoming releases scheduled yet.</h3>
            <p className="text-gray-400 mt-2">Check back soon for new announcements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {books.map((book, index) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100"
              >
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-6 bg-gray-100">
                  <img 
                    src={`http://localhost:5000/uploads/${book.thumbnail}`} 
                    alt={book.title}
                    className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-0 transition-opacity" />
                  
                  {/* DATE BADGE */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Release</p>
                      <p className="text-lg font-black text-purple-600 leading-none mt-1">
                        {book.releaseDate ? new Date(book.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'}
                      </p>
                    </div>
                  </div>

                  {/* TIME LEFT BADGE */}
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="bg-purple-600 text-white rounded-2xl py-3 px-6 flex items-center justify-between shadow-xl">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Coming Soon
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="px-2">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-purple-600 transition truncate">
                    {book.title}
                  </h2>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">{book.author}</p>
                    <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {book.category?.name || "Premium"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UpcomingBooks;
