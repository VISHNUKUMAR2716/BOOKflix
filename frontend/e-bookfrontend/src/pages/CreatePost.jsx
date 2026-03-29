import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    files: [],
  });

  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  /* ---------------- Input Change ---------------- */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------- File Selection ---------------- */

  const processFiles = (files) => {
    const validFiles = files.filter((file) =>
      file.type.startsWith("image") || file.type.startsWith("video")
    );

    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));

    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));

    setPreview((prev) => [...prev, ...newPreviews]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));

    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFormData((prev) => ({ ...prev, files: [] }));
    setPreview([]);
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = async (e, isPublished = true) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        setMessage({ type: "error", text: "Title and content are required." });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "Please login first." });
        setLoading(false);
        return;
      }

      const postData = new FormData();
      postData.append("title", formData.title);
      postData.append("content", formData.content);
      postData.append("published", isPublished);

      formData.files.forEach((file) => {
        postData.append("files", file);
      });

      await axios.post(
        "https://bookflix-1-o3od.onrender.com/api/posts/create",
        postData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: "success",
        text: isPublished
          ? "Post published successfully!"
          : "Draft saved successfully!",
      });

      setTimeout(() => {
        navigate("/user", { state: { refresh: true } });
      }, 1200);

    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Error creating post.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white flex items-center justify-center p-6">

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">

        <button
          onClick={() => navigate("/user")}
          className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 transition"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Create New Post ✍️
        </h1>

        {message.text && (
          <div
            className={`mb-6 px-5 py-4 rounded-xl font-medium ${
              message.type === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-green-50 text-green-600 border border-green-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-8">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a powerful title..."
              className="w-full px-5 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows="6"
              placeholder="Write something meaningful..."
              className="w-full px-5 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Upload Images / Videos
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl p-10 text-center transition bg-gray-50"
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <div className="space-y-3">
                <div className="text-4xl">📁</div>
                <p className="text-gray-600 font-medium">
                  Drag & drop files here
                </p>
                <p className="text-gray-400 text-sm">
                  or click to browse your device
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, GIF, MP4 up to 50MB
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">
                  Selected Files ({preview.length})
                </h3>

                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="text-sm text-red-500 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {preview.map((item, index) => (
                  <div
                    key={index}
                    className="relative group rounded-2xl overflow-hidden shadow-md border border-gray-100"
                  >
                    {item.type.startsWith("image") ? (
                      <img
                        src={item.url}
                        alt="preview"
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-44 flex items-center justify-center bg-gray-200">
                        🎥 Video File
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-3 py-2 truncate">
                      {item.name}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-6 pt-6 border-t">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg"
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}