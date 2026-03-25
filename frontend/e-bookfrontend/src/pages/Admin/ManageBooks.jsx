import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminUpload() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [audio, setAudio] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/admin/categories",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else if (Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !author || !category || !pdf || !thumbnail) {
      setMessage("⚠ Please fill all fields and upload both files.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("category", category);
    formData.append("pdf", pdf);
    if (audio) {
      formData.append("audio", audio);
    }
    formData.append("thumbnail", thumbnail);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/books/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message || "✅ Book uploaded successfully!");

      setTitle("");
      setAuthor("");
      setCategory("");
      setPdf(null);
      setAudio(null);
      setThumbnail(null);
      document.getElementById("pdfInput").value = "";
      if (document.getElementById("audioInput")) document.getElementById("audioInput").value = "";
      document.getElementById("thumbInput").value = "";
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "❌ Upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-6">

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-gray-800">
            📚 Upload New Book
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Add a new book to the digital library
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 text-center bg-blue-50 border border-blue-200 text-blue-600 text-sm p-3 rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Book Title
            </label>
            <input
              type="text"
              placeholder="Enter book title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Author */}
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Author Name
            </label>
            <input
              type="text"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* PDF Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Upload PDF
            </label>

            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
              <input
                type="file"
                id="pdfInput"
                accept=".pdf"
                onChange={(e) => setPdf(e.target.files[0])}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload the book PDF file
              </p>
            </div>
          </div>

          {/* Audio Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Upload Audio Book (Optional)
            </label>

            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
              <input
                type="file"
                id="audioInput"
                accept="audio/*"
                onChange={(e) => setAudio(e.target.files[0])}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload the audio file if available
              </p>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Upload Thumbnail
            </label>

            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
              <input
                type="file"
                id="thumbInput"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files[0])}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload book cover image
              </p>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition transform"
          >
            🚀 Upload Book
          </button>

        </form>
      </div>
    </div>
  );
}