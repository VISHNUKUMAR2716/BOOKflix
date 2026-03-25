
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const UserSettings = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscription, setSubscription] = useState(null);

  /* ================= FETCH USER ================= */

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/auth/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setFormData({
          name: res.data.name,
          email: res.data.email,
        });
        setPhotoPreview(`http://localhost:5000/uploads/${res.data.photo}`);
        setSubscription(res.data.subscription);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ================= HANDLERS ================= */

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image")) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage("");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    if (photo) data.append("photo", photo);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/auth/profile/${userId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Profile updated successfully!");
      setMessageType("success");

      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
    } catch {
      setMessage("Failed to update profile");
      setMessageType("error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/auth/profile/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.clear();
      navigate("/");
    } catch {
      setMessage("Failed to delete account");
      setMessageType("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 py-16 px-6">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto space-y-10"
      >

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl">

          <button
            onClick={() => navigate("/user")}
            className="text-sm opacity-80 hover:opacity-100 transition"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-4xl font-bold mt-4">
            Account Settings
          </h1>

          <p className="opacity-80 mt-2">
            Manage your profile information and account preferences
          </p>

        </div>

        {/* MESSAGE */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 rounded-xl text-sm font-medium ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* PROFILE CARD */}
        <div className="backdrop-blur-md bg-white/70 border border-gray-200 rounded-3xl shadow-xl p-10">

          <h2 className="text-2xl font-semibold mb-8 text-gray-800">
            Profile Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-8">

            {/* PHOTO */}
            <div className="flex items-center gap-8">

              <motion.img
                whileHover={{ scale: 1.05 }}
                src={photoPreview}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-200 shadow-md"
              />

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Profile Photo
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block text-sm"
                />
              </div>

            </div>

            {/* NAME */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* SAVE BUTTON */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={updating}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition ${
                updating
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              }`}
            >
              {updating ? "Updating..." : "Save Changes"}
            </motion.button>

          </form>

        </div>

        {/* SUBSCRIPTION CARD */}
        {subscription && (
          <div className="backdrop-blur-md bg-white/70 border border-gray-200 rounded-3xl shadow-xl p-10">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center gap-3">
              <span className="bg-yellow-100 text-yellow-600 p-2 text-xl rounded-xl">👑</span> Current Plan
            </h2>

            <div className={`p-6 rounded-2xl border ${subscription.status === 'active' ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-1">Your Tier</h3>
                  <p className="text-3xl font-black text-gray-900">{subscription.plan || "Free"}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${subscription.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-200 text-gray-600'}`}>
                  {subscription.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {subscription.status === 'active' ? (
                <div className="mt-6 pt-6 border-t border-indigo-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <span className="text-gray-600 font-medium tracking-wide">
                    {subscription.endDate ? `Valid until ${new Date(subscription.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : 'Lifetime Access'}
                  </span>
                  {subscription.plan !== "Premium" && (
                    <button onClick={() => navigate('/subscription')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95">
                      Upgrade Plan
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                   <button onClick={() => navigate('/subscription')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95">
                      Subscribe Now
                    </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DANGER ZONE */}
        <div className="border border-red-200 bg-red-50 rounded-3xl p-8 shadow-md">

          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Danger Zone
          </h2>

          <p className="text-gray-600 mb-6">
            Permanently delete your account and all associated data.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition"
          >
            Delete Account
          </button>

        </div>

      </motion.div>

      {/* DELETE MODAL */}

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 w-96 shadow-2xl"
            >

              <h3 className="text-xl font-bold text-red-600 mb-4">
                Confirm Deletion
              </h3>

              <p className="text-gray-600 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-4">

                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>

              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserSettings;