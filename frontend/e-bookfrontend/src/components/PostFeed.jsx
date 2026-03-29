
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState("");

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/posts/feed");
      setPosts(res.data || []);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.put(
        `https://bookflix-1-o3od.onrender.com/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
    } catch {}
  };

  const handleAddComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;

    try {
      const res = await axios.post(
        `https://bookflix-1-o3od.onrender.com/api/posts/${postId}/comment`,
        { text: newComment[postId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
    } catch {}
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    await axios.delete(`https://bookflix-1-o3od.onrender.com/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setPosts(posts.filter((p) => p._id !== postId));
  };

  const handleIncreaseViews = async (postId) => {
    try {
      await axios.put(`https://bookflix-1-o3od.onrender.com/api/posts/${postId}/view`);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {posts.map((post) => {
        const isAuthor = post.author?._id === userId;
        const hasLiked = post.likes?.includes(userId);

        return (
          <div
            key={post._id}
            onMouseEnter={() => handleIncreaseViews(post._id)}
            className="backdrop-blur-md bg-white/60 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition duration-300"
          >

            {/* HEADER */}
            <div className="flex justify-between items-center p-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                  {post.author?.name?.charAt(0) || "U"}
                </div>

                <div>
                  <p className="font-semibold text-gray-800">
                    {post.author?.name || "User"}
                  </p>

                  <p className="text-xs text-gray-500">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>

              </div>

              {isAuthor && (
                <button
                  onClick={() => handleDeletePost(post._id)}
                  className="text-red-500 text-sm hover:text-red-600"
                >
                  Delete
                </button>
              )}

            </div>

            {/* POST CONTENT */}
            <div className="px-5 pb-4">

              <h3 className="text-lg font-semibold mb-1 text-gray-900">
                {post.title}
              </h3>

              <p className="text-gray-700 leading-relaxed">
                {post.content}
              </p>

              {(post.images?.length > 0 || post.videos?.length > 0) && (
                <div className="grid grid-cols-2 gap-3 mt-4">

                  {post.images?.map((img, i) => (
                    <img
                      key={i}
                      src={`https://bookflix-1-o3od.onrender.com/uploads/${img}`}
                      className="rounded-xl object-cover w-full h-48 hover:scale-105 transition"
                    />
                  ))}

                  {post.videos?.map((vid, i) => (
                    <video
                      key={i}
                      controls
                      src={`https://bookflix-1-o3od.onrender.com/uploads/${vid}`}
                      className="rounded-xl object-cover w-full h-48"
                    />
                  ))}

                </div>
              )}

            </div>

            {/* STATS */}
            <div className="flex gap-6 text-sm text-gray-500 px-5 py-3 border-t">
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
              <span>👁 {post.views || 0}</span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex border-t text-sm font-medium">

              <button
                onClick={() => handleLike(post._id)}
                className="flex-1 py-3 hover:bg-blue-50 transition"
              >
                {hasLiked ? "❤️ Liked" : "🤍 Like"}
              </button>

              <button
                onClick={() =>
                  setExpandedComments((prev) => ({
                    ...prev,
                    [post._id]: !prev[post._id],
                  }))
                }
                className="flex-1 py-3 hover:bg-blue-50 transition"
              >
                💬 Comment
              </button>

            </div>

            {/* COMMENTS */}
            {expandedComments[post._id] && (
              <div className="p-5 border-t bg-gray-50/60">

                <div className="flex gap-3 mb-4">

                  <input
                    value={newComment[post._id] || ""}
                    onChange={(e) =>
                      setNewComment((prev) => ({
                        ...prev,
                        [post._id]: e.target.value,
                      }))
                    }
                    placeholder="Write a comment..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => handleAddComment(post._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-full text-sm"
                  >
                    Post
                  </button>

                </div>

                {post.comments?.map((c, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-3 mb-2 bg-white/60"
                  >
                    <p className="font-semibold text-sm">
                      {c.user?.name || "User"}
                    </p>
                    <p className="text-sm text-gray-700">
                      {c.text}
                    </p>
                  </div>
                ))}

              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
