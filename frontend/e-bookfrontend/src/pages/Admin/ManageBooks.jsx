import { useState, useEffect } from "react";
import axios from "axios";

export default function ManageBooks() {
  const [activeTab, setActiveTab] = useState("list");
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  
  // Upload States
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [pdf, setPdf] = useState(null);
  const [audio, setAudio] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [releaseDate, setReleaseDate] = useState("");

  // Edit States
  const [editingBook, setEditingBook] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editReleaseDate, setEditReleaseDate] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const token = localStorage.getItem("token");

  // ================= FETCH DATA =================
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/admin/books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch books error:", err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else if (Array.isArray(res.data.categories)) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  // ================= CRUD ACTIONS =================

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !author || !category || !pdf || !thumbnail) {
      setMessage("⚠ Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("category", category);
    formData.append("pdf", pdf);
    if (audio) formData.append("audio", audio);
    formData.append("thumbnail", thumbnail);
    if (releaseDate) formData.append("releaseDate", releaseDate);

    try {
      const res = await axios.post("https://bookflix-1-o3od.onrender.com/api/books/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Book uploaded successfully!");
      setTitle(""); setAuthor(""); setCategory(""); setPdf(null); setAudio(null); setThumbnail(null); setReleaseDate("");
      fetchBooks();
      setActiveTab("list");
    } catch (err) {
      setMessage("❌ Upload failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`https://bookflix-1-o3od.onrender.com/api/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Book deleted successfully");
      fetchBooks();
    } catch (err) {
      setMessage("❌ Delete failed");
    }
  };

  const handleEditClick = (book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCategory(book.category?._id || book.category || "");
    setEditReleaseDate(book.releaseDate ? new Date(book.releaseDate).toISOString().slice(0, 16) : "");
    setEditStatus(book.status);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://bookflix-1-o3od.onrender.com/api/admin/books/${editingBook._id}`, {
        title: editTitle,
        author: editAuthor,
        category: editCategory,
        releaseDate: editReleaseDate,
        status: editStatus
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Book updated successfully");
      setEditingBook(null);
      fetchBooks();
    } catch (err) {
      setMessage("❌ Update failed");
    }
  };

  // ================= RENDER =================

  const filteredBooks = books.filter(b => 
    b.title?.toLowerCase().includes(search.toLowerCase()) || 
    b.author?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            📚 Book Management
          </h1>
          <p className="text-gray-500 mt-1">Manage, edit, and upload books to your library</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "list" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Books List
          </button>
          <button 
            onClick={() => setActiveTab("add")}
            className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === "add" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Upload New
          </button>
        </div>
      </div>

      {/* MESSAGE POPUP */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl shadow-lg border animate-bounce ${message.includes("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
             onClick={() => setMessage("")}>
          {message}
        </div>
      )}

      {/* LIST TAB */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* SEARCH & STATS */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search by title or author..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div className="text-sm font-semibold text-gray-500 px-4 py-2 bg-gray-100 rounded-full">
              Showing {filteredBooks.length} Books
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700">Cover</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Book Details</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-right text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></td></tr>
                  ) : filteredBooks.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-20 text-gray-400">No books found matching your search.</td></tr>
                  ) : filteredBooks.map((book) => (
                    <tr key={book._id} className="hover:bg-slate-50 transition group">
                      <td className="px-6 py-4">
                        <img 
                          src={book.thumbnail?.startsWith("http") ? book.thumbnail : `https://bookflix-1-o3od.onrender.com/uploads/${book.thumbnail}`} 
                          alt={book.title} 
                          className="w-12 h-16 object-cover rounded-md shadow-sm group-hover:scale-110 transition duration-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{book.title}</p>
                        <p className="text-sm text-gray-500 italic">by {book.author}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                          {book.category?.name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          book.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          book.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          book.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {book.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(book)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(book._id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD TAB */}
      {activeTab === "add" && (
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Book Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Great Gatsby" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Author *</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. F. Scott Fitzgerald" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Release Date (Optional)</label>
                <input type="datetime-local" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">PDF File *</label>
                <input type="file" accept=".pdf" onChange={(e) => setPdf(e.target.files[0])} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Thumbnail *</label>
                <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Audio Book (Optional)</label>
                <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files[0])} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition transform">
                  🚀 Upload to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
              <h2 className="text-xl font-bold text-blue-900">✏️ Edit Book Metadata</h2>
              <button 
                onClick={() => setEditingBook(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Author</label>
                <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Release Date</label>
                <input type="datetime-local" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditingBook(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM ANIMATIONS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
      `}</style>

    </div>
  );
}