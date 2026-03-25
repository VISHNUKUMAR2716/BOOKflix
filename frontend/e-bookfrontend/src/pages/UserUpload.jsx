import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const UploadBook = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pdf, setPdf] = useState(null);
  const [audio, setAudio] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [step, setStep] = useState(1);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= Fetch Categories ================= */

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/books/categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  /* ================= Step Navigation ================= */
  
  const handleNext = (e) => {
    e.preventDefault();
    setMessage("");
    if (!title.trim() || !author.trim() || !selectedCategory) {
      setMessage("Please fill in Title, Author, and Category before proceeding.");
      setMessageType("error");
      return;
    }
    setStep(2);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setMessage("");
    setStep(1);
  };

  /* ================= Submit ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!title || !author || !selectedCategory || !pdf || !thumbnail) {
      setMessage("All fields are required.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("author", author.trim());
    formData.append("category", selectedCategory);
    formData.append("pdf", pdf);
    if (audio) {
      formData.append("audio", audio);
    }
    formData.append("thumbnail", thumbnail);

    try {
      await axios.post(
        "http://localhost:5000/api/books/user-upload",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("✓ Book uploaded successfully!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/user", { state: { refresh: true } });
      }, 1500);

    } catch (error) {
      setMessage("Upload failed. Try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white flex items-center justify-center p-8">

      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-10"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 tracking-tight">
            Upload Book 📘
          </h2>
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Step {step} of 2
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              messageType === "success"
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Book Title
              </label>
              <input
                type="text"
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Author */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Author
              </label>
              <input
                type="text"
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Category
              </label>
              <select
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition transform hover:scale-[1.02]"
            >
              Continue to Uploads →
            </button>
          </motion.div>
        )}

        {/* STEP 2: File Uploads */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Thumbnail Upload  */}
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              Cover Image (Thumbnail)
            </label>
            <div className="mb-6">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-6 text-center bg-indigo-50/50 transition relative overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith("image")) {
                      setThumbnail(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {!thumbnailPreview ? (
                  <>
                    <p className="text-gray-600 font-medium">
                      Click or Drag cover image here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, GIF
                    </p>
                  </>
                ) : (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-contain bg-white opacity-80"
                  />
                )}
              </div>
            </div>

            {/* PDF Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Book PDF File
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdf(e.target.files[0])}
                className="w-full px-5 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Audio Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Audio Book File <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudio(e.target.files[0])}
                className="w-full px-5 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleBack}
                type="button"
                className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-2/3 py-3 rounded-xl font-semibold text-white transition transform hover:scale-[1.02] ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed transform-none"
                    : "bg-green-500 hover:bg-green-600 shadow-lg"
                }`}
              >
                {loading ? "Uploading..." : "Publish Book"}
              </button>
            </div>
          </motion.div>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Your book will be reviewed before publishing.
        </p>
      </motion.form>
    </div>
  );
};

export default UploadBook;