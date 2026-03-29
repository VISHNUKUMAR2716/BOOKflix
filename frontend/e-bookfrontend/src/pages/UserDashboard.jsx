import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserNavbar from "../pages/UserNavbar";
import PostFeed from "../components/PostFeed";
import { Search, User, Bell, Settings, Heart, Play, BookOpen, UserPlus, Users } from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("books");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [currentUser, setCurrentUser] = useState(null);
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  /* ================= FETCH BOOKS ================= */

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/books");
      setBooks(res.data);
      setFilteredBooks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentUserProfile = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/books/recommendations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendedBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    }
  };


  useEffect(() => {
    fetchBooks();
    fetchUsers();
    fetchCurrentUserProfile();
    fetchRecommendations();

    // Fetch Dynamic Categories from Database
    axios
      .get("https://bookflix-1-o3od.onrender.com/api/books/categories")
      .then((res) => setDbCategories(res.data || []))
      .catch((err) => console.error("Failed to fetch categories", err));
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchBooks();
    }
  }, [location.state]);

  /* ================= FILTER ================= */

  useEffect(() => {
    let filtered = books;

    if (activeTab === "books") {
      // Library shows only approved, pending and upcoming (but filtered below)
      filtered = filtered.filter((book) => book.status === "approved" || book.status === "pending" || book.status === "upcoming");
    } else if (activeTab === "trace") {
      // Trace shows only rejected
      filtered = filtered.filter((book) => book.status === "rejected");
    }

    if (search && activeTab === "books") {
      filtered = filtered.filter((book) =>
        book.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== "All" && activeTab === "books") {
      filtered = filtered.filter((book) =>
        book.category === category ||
        (book.category && book.category._id === category) ||
        (book.category && book.category.name === category)
      );
    }

    setFilteredBooks(filtered);
  }, [search, category, books, activeTab]);

  /* ================= LIKE ================= */

  const handleLike = async (id) => {
    try {
      const res = await axios.put(
        `https://bookflix-1-o3od.onrender.com/api/books/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBooks((prev) =>
        prev.map((b) => (b._id === id ? res.data : b))
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FOLLOW / UNFOLLOW ================= */

  const handleFollowToggle = async (targetId) => {
    try {
      await axios.put(
        `https://bookflix-1-o3od.onrender.com/api/users/${targetId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // Refresh the users list to get updated followers/following
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  /* ================= UI ================= */

  const categories = ["All", "Programming", "Science", "Novel", "History"];

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Sidebar */}
      <UserNavbar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* TOP GRADIENT HEADER */}
        <div className="bg-gradient-to-r from-[#6ee7b7] to-[#93c5fd] w-full pt-8 pb-32 px-12 relative rounded-bl-[4rem]">
          {/* TOP RIGHT ICONS */}
          <div className="absolute top-8 right-12 flex items-center gap-6 text-white/90">
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <BookOpen className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <Bell className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <User className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <Settings className="w-5 h-5 cursor-pointer hover:text-white transition" />
          </div>

          {/* TITLE */}
          <h1 className="text-5xl font-black text-gray-900 mt-12 tracking-tight" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Best Books
          </h1>

          {/* PILL TABS (Dynamic Categories from DB) */}
          <div className="flex flex-wrap items-center gap-8 mt-10 ml-2">

            {/* 'All' default category */}
            <button
              onClick={() => setCategory("All")}
              className={`font-bold transition-all duration-300 text-[15px] ${category === "All"
                  ? "bg-white text-[#10b981] shadow-sm rounded-full px-6 py-2.5 scale-105"
                  : "text-gray-800 hover:text-gray-600 px-2 py-2.5"
                }`}
            >
              All
            </button>

            {/* Fetched Categories */}
            {dbCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setCategory(cat.name)}
                className={`font-bold transition-all duration-300 text-[15px] ${category === cat.name
                    ? "bg-white text-[#10b981] shadow-sm rounded-full px-6 py-2.5 scale-105"
                    : "text-gray-800 hover:text-gray-600 px-2 py-2.5"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="px-12 -mt-16 relative z-10 pb-20">

          {/* Main Tabs Override (Books vs Posts) & Search */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-10 gap-4 mt-4">
            <div className="flex gap-4">
              {["books", "posts", "people", "trace"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl font-bold capitalize transition ${activeTab === tab
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  {tab === "books" ? "Library" : tab === "posts" ? "Community" : tab === "people" ? "People" : "Trace"}
                </button>
              ))}
            </div>
            {activeTab === "books" && (
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search titles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#6ee7b7] focus:outline-none font-medium"
                />
              </div>
            )}
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6ee7b7] border-t-transparent"></div>
            </div>
          )}

          {/* ================= RECOMMENDATIONS ================= */}
          {!loading && activeTab === "books" && search === "" && category === "All" && recommendedBooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#6ee7b7]/20 p-2 rounded-lg">
                  <Play className="w-5 h-5 text-[#10b981] fill-[#10b981]" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Recommended for You</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendedBooks.map((book) => (
                  <div 
                    key={`rec-${book._id}`} 
                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col group cursor-pointer hover:shadow-md transition"
                    onClick={() => {
                        if (!currentUser || currentUser.subscription?.status !== "active") {
                          navigate("/subscription");
                          return;
                        }
  
                        // Increment views in backend
                        axios.put(`https://bookflix-1-o3od.onrender.com/api/books/${book._id}/view`).catch(err => console.error("Failed to update view count", err));
  
                        navigate("/read", {
                          state: {
                            pdfUrl: `https://bookflix-1-o3od.onrender.com/uploads/${book.pdf}`,
                            audioUrl: book.audio ? `https://bookflix-1-o3od.onrender.com/uploads/${book.audio}` : null,
                          },
                        });
                      }}
                  >
                    <div className="h-40 w-full rounded-2xl overflow-hidden mb-4 relative bg-gray-100">
                      <img 
                        src={`https://bookflix-1-o3od.onrender.com/uploads/${book.thumbnail}`} 
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-full text-[#10b981] shadow-sm uppercase tracking-wider border border-white">
                          {book.category?.name || "Premium"}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{book.title}</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{book.author}</p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6ee7b7]"></div>
                        <p className="text-[11px] font-bold text-gray-500 italic">{book.recommendationReason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ================= UPCOMING / COMING SOON ================= */}
          {!loading && activeTab === "books" && search === "" && category === "All" && books.filter(b => b.status === "upcoming").length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-16 bg-gradient-to-br from-indigo-50 to-purple-50 p-10 rounded-[4rem] border border-indigo-100/50 shadow-inner"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-2xl">
                    <Bell className="w-6 h-6 text-purple-600 animate-bounce" />
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Coming Soon</h2>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-3 py-1 rounded-lg uppercase tracking-widest">Next Release</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {books.filter(b => b.status === "upcoming").map((book) => (
                  <div 
                    key={`upcoming-${book._id}`} 
                    className="group cursor-pointer"
                    onClick={() => alert("Stay tuned! This book is coming soon to BookFlix.")}
                  >
                    <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden mb-3 relative bg-gray-200 shadow-md transform group-hover:-translate-y-2 transition-transform duration-500">
                      <img 
                        src={`https://bookflix-1-o3od.onrender.com/uploads/${book.thumbnail}`} 
                        alt={book.title}
                        className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-indigo-900/40 opacity-40 group-hover:opacity-0 transition-opacity"></div>
                      <div className="absolute top-3 right-3">
                        <span className="bg-purple-600 text-[10px] font-black px-3 py-1 rounded-full text-white shadow-lg uppercase tracking-widest border border-purple-400">
                          PRE-ORDER
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-purple-600 transition truncate px-1">{book.title}</h3>
                    {book.releaseDate && (
                      <p className="text-[10px] text-purple-500 font-bold px-1">
                        Releases: {new Date(book.releaseDate).toLocaleDateString()}
                      </p>
                    )}

                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ================= BOOKS & TRACE GRID ================= */}
          <AnimatePresence mode="wait">
            {!loading && (activeTab === "books" || activeTab === "trace") && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {filteredBooks.filter(b => b.status !== "upcoming").length === 0 ? (
                  <div className="text-center py-24 text-gray-400">
                    <p className="text-xl font-medium">No books found in this section</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-x-8 md:gap-y-12">
                    {filteredBooks.filter(b => b.status !== "upcoming").map((book, index) => {
                      const liked = book.likes?.includes(userId);

                      return (
                        <motion.div
                          key={book._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex flex-col cursor-pointer"
                        >
                          {/* Image */}
                            <div
                              className="w-full aspect-[2/3] overflow-hidden rounded-[2rem] mb-4 shadow-md relative bg-gray-100 group-hover:shadow-xl transition-all duration-500"
                              onClick={() => {
                                if (book.status !== "approved") {
                                  alert(`This book is currently ${book.status}. You can only read or listen to approved books.`);
                                  return;
                                }
                                
                                if (!currentUser || currentUser.subscription?.status !== "active") {
                                  navigate("/subscription");
                                  return;
                                }

                                // Increment views in backend
                                axios.put(`https://bookflix-1-o3od.onrender.com/api/books/${book._id}/view`).catch(err => console.error("Failed to update view count", err));

                                navigate("/read", {
                                  state: {
                                    pdfUrl: `https://bookflix-1-o3od.onrender.com/uploads/${book.pdf}`,
                                    audioUrl: book.audio ? `https://bookflix-1-o3od.onrender.com/uploads/${book.audio}` : null,
                                  },
                                });
                              }}
                            >
                              <img
                                src={`https://bookflix-1-o3od.onrender.com/uploads/${book.thumbnail}`}
                                alt={book.title}
                                className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out ${book.status !== 'approved' ? 'opacity-50 grayscale' : ''}`}
                              />
                              
                              {/* STATUS BADGE */}
                              <div className="absolute top-4 right-4 z-20">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md border border-white/20 ${
                                  book.status === "approved" 
                                    ? "bg-emerald-500/90 text-white" 
                                    : book.status === "pending"
                                      ? "bg-amber-500/90 text-white"
                                      : book.status === "upcoming"
                                        ? "bg-purple-500/90 text-white"
                                        : "bg-rose-500/90 text-white"
                                }`}>
                                  {book.status}
                                </span>
                              </div>

                              {/* Overlay Play Icon on Hover */}
                              {book.status === "approved" && (
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-white/90 p-4 rounded-full shadow-lg backdrop-blur-sm">
                                    <Play className="w-6 h-6 text-gray-900 fill-gray-900 ml-1" />
                                  </div>
                                </div>
                              )}
                            </div>


                          {/* Info */}
                          <div className="px-1">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-tight line-clamp-1 group-hover:text-[#10b981] transition-colors">
                              {book.title}
                            </h2>
                            <div className="flex justify-between items-center mt-1.5">
                              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest truncate max-w-[70%]">
                                {book.author}
                              </p>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(book._id);
                                }}
                                className="flex items-center gap-1 hover:scale-110 transition active:scale-95"
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 transition-all ${liked ? 'text-red-500 fill-red-500' : 'text-gray-300'}`}
                                />
                                <span className="text-[10px] font-black text-gray-400">{book.likes?.length || 0}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ================= POSTS ================= */}
            {!loading && activeTab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 rounded-3xl p-8"
              >
                <PostFeed />
              </motion.div>
            )}

            {/* ================= PEOPLE ================= */}
            {!loading && activeTab === "people" && (
              <motion.div
                key="people"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {users.length === 0 ? (
                  <div className="col-span-full text-center py-24 text-gray-400">
                    <p className="text-xl font-medium">No other users found</p>
                  </div>
                ) : (
                  users.map((u) => {
                    const isFollowing = u.followers.some(f => f._id === userId || f === userId);
                    const isSelf = u._id === userId;

                    return (
                      <div key={u._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center transition hover:shadow-md">
                        <img
                          src={u.photo && u.photo !== "default-avatar.png" ? `https://bookflix-1-o3od.onrender.com/uploads/${u.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt={u.name}
                          className="w-24 h-24 rounded-full mb-4 cursor-pointer hover:opacity-80 transition object-cover"
                          onClick={() => navigate(`/profile/${u._id}`)}
                        />
                        <h3
                          className="text-xl font-bold text-gray-900 cursor-pointer hover:underline"
                          onClick={() => navigate(`/profile/${u._id}`)}
                        >
                          {u.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">{u.email}</p>

                        <div className="flex gap-6 mb-6">
                          <div className="text-center">
                            <span className="block font-black text-gray-900">{u.followers?.length || 0}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Followers</span>
                          </div>
                          <div className="text-center">
                            <span className="block font-black text-gray-900">{u.following?.length || 0}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Following</span>
                          </div>
                        </div>

                        {!isSelf && (
                          <button
                            onClick={() => handleFollowToggle(u._id)}
                            className={`w-full py-2.5 rounded-xl font-bold transition flex justify-center items-center gap-2 ${isFollowing
                                ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
                                : "bg-[#6ee7b7] text-white hover:bg-[#34d399]"
                              }`}
                          >
                            {isFollowing ? (
                              "Unfollow"
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" /> Follow
                              </>
                            )}
                          </button>
                        )}
                        {isSelf && (
                          <button
                            onClick={() => navigate('/settings')}
                            className="w-full py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}