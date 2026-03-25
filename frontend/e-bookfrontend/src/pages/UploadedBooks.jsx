import { useEffect, useState } from "react";
import axios from "axios";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

export default function UploadedBooks() {
    const [books, setBooks] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ title: "", author: "" });


    const fetchBooks = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5000/api/books"
            );
            setBooks(res.data);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    // 🗑 DELETE
    const handleDelete = async (id) => {
        console.log("Deleting ID:", id);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:5000/api/books/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );


            setBooks(books.filter((book) => book._id !== id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    };



    // ✏ START EDIT
    const startEdit = (book) => {
        setEditingId(book._id);
        setEditData({ title: book.title, author: book.author });
    };

    // ✏ SAVE EDIT
    const handleUpdate = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(
                `http://localhost:5000/api/books/${id}`,
                editData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setBooks(
                books.map((b) => (b._id === id ? res.data : b))
            );

            setEditingId(null);
        } catch (err) {
            console.error("Update error:", err);
            
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-xl mx-auto mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 font-sans tracking-tight mb-8 text-center">
                    Your Uploads
                </h1>

                {books.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">No books uploaded yet.</div>
                ) : (
                    books.map((book) => (
                        <div key={book._id} className="bg-white border border-gray-200 rounded-lg mb-8 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px]">
                                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-bold font-sans text-gray-700 capitalize">
                                            {book.author ? book.author.charAt(0) : "U"}
                                        </div>
                                    </div>
                                    <span className="font-semibold text-sm text-gray-900">{book.author || "Unknown"}</span>
                                </div>
                                <button className="p-1 hover:bg-gray-50 rounded-full transition">
                                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Image (Square crop) */}
                            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center relative group">
                                <img 
                                    src={`http://localhost:5000/uploads/${book.thumbnail}`} 
                                    alt={book.title} 
                                    className="w-full h-full object-cover"
                                />
                                {/* Quick actions overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => startEdit(book)}
                                        className="bg-white/90 text-gray-900 px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition"
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => handleDelete(book._id)}
                                        className="bg-red-500/90 text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-3 text-gray-800">
                                    <div className="flex gap-4">
                                        <Heart className={`w-[26px] h-[26px] cursor-pointer hover:text-gray-500 transition-colors ${book.likes?.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                        <MessageCircle className="w-[26px] h-[26px] cursor-pointer hover:text-gray-500 transition-colors transform -scale-x-100" />
                                        <Send className="w-[26px] h-[26px] cursor-pointer hover:text-gray-500 transition-colors" />
                                    </div>
                                    <Bookmark className="w-[26px] h-[26px] cursor-pointer hover:text-gray-500 transition-colors" />
                                </div>

                                <div className="font-semibold text-sm text-gray-900 mb-1">
                                    {book.likes?.length || 0} likes
                                </div>

                                {/* Caption & Edit Area */}
                                {editingId === book._id ? (
                                    <div className="mt-2 text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
                                        <p className="font-semibold mb-2 text-gray-700">Editting Post...</p>
                                        <input
                                            value={editData.title}
                                            onChange={(e) =>
                                                setEditData({ ...editData, title: e.target.value })
                                            }
                                            placeholder="Book Title"
                                            className="w-full border-b border-gray-300 bg-transparent px-1 py-1 mb-2 focus:outline-none focus:border-indigo-500"
                                        />
                                        <input
                                            value={editData.author}
                                            onChange={(e) =>
                                                setEditData({ ...editData, author: e.target.value })
                                            }
                                            placeholder="Author Name"
                                            className="w-full border-b border-gray-300 bg-transparent px-1 py-1 mb-3 focus:outline-none focus:border-indigo-500"
                                        />

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdate(book._id)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs px-4 py-1.5 rounded"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs px-4 py-1.5 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-900 mt-1 leading-relaxed">
                                        <span className="font-semibold mr-2">{book.author || "Unknown"}</span>
                                        Just added <span className="italic">"{book.title}"</span> to the collection! 📚✨
                                    </div>
                                )}
                                
                                <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-2">
                                    {new Date(book.createdAt || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
