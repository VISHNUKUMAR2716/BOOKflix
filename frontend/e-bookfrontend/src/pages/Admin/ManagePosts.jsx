
import React, { useEffect, useState } from "react";
import axios from "axios";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState("all");

  const token = localStorage.getItem("token");

  /* ================= FETCH POSTS ================= */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/admin/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load posts");
      setMessageType("error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 20000);
    return () => clearInterval(interval);
  }, []);

  /* ================= ACTIONS ================= */

  const handlePublish = async (id) => {
    setActionInProgress(id);
    try {
      await axios.put(
        `https://bookflix-1-o3od.onrender.com/api/admin/posts/${id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Post published successfully");
      setMessageType("success");
      fetchPosts();
    } catch (error) {
      setMessage("Failed to publish post");
      setMessageType("error");
    }
    setActionInProgress(null);
  };

  const handleUnpublish = async (id) => {
    setActionInProgress(id);
    try {
      await axios.put(
        `https://bookflix-1-o3od.onrender.com/api/admin/posts/${id}/unpublish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Post unpublished successfully");
      setMessageType("success");
      fetchPosts();
    } catch {
      setMessage("Failed to unpublish post");
      setMessageType("error");
    }
    setActionInProgress(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;

    setActionInProgress(id);
    try {
      await axios.delete(`https://bookflix-1-o3od.onrender.com/api/admin/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Post deleted successfully");
      setMessageType("success");
      fetchPosts();
    } catch {
      setMessage("Delete failed");
      setMessageType("error");
    }
    setActionInProgress(null);
  };

  /* ================= FILTER ================= */

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterPublished === "published")
      return matchesSearch && post.published;
    if (filterPublished === "unpublished")
      return matchesSearch && !post.published;

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-8">

      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          📝 Post Management
        </h1>
        <p className="text-gray-500">
          Manage publishing status and monitor user posts
        </p>
      </div>

      {/* ALERT MESSAGE */}
      {message && (
        <div
          className={`mb-6 px-5 py-3 rounded-lg shadow ${
            messageType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-5">

          <input
            type="text"
            placeholder="🔍 Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Posts</option>
            <option value="published">Published</option>
            <option value="unpublished">Draft</option>
          </select>

          <div className="flex items-center gap-6 text-sm">
            <span className="font-semibold text-gray-600">
              Total: {posts.length}
            </span>
            <span className="text-green-600 font-semibold">
              Published: {posts.filter((p) => p.published).length}
            </span>
            <span className="text-yellow-600 font-semibold">
              Draft: {posts.filter((p) => !p.published).length}
            </span>
          </div>

        </div>
      </div>

      {/* POSTS TABLE */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No posts found
          </div>
        ) : (
          <table className="w-full text-left">

            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-center">Views</th>
                <th className="px-6 py-4 text-center">Comments</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredPosts.map((post) => (
                <tr
                  key={post._id}
                  className="border-b hover:bg-gray-50 transition"
                >

                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">
                      {post.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {post.content?.substring(0, 60)}...
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {post.author?.photo && (
                        <img
                          src={`https://bookflix-1-o3od.onrender.com/uploads/${post.author.photo}`}
                          className="w-8 h-8 rounded-full object-cover"
                          alt=""
                        />
                      )}
                      <span className="font-medium">
                        {post.author?.name || "Unknown"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      👁 {post.views || 0}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                      💬 {post.comments?.length || 0}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {post.published ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Published
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">

                    {post.published ? (
                      <button
                        onClick={() => handleUnpublish(post._id)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(post._id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Publish
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(post._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Delete
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}
      </div>
    </div>
  );
};

export default ManagePosts;
