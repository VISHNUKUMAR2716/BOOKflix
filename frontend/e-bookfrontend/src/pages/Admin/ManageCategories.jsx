
import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/admin/categories",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load categories");
      setMessageType("error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ================= ADD / EDIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Category name required");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      if (editingCategory) {
        await axios.put(
          `http://localhost:5000/api/admin/categories/${editingCategory._id}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("Category updated successfully");
      } else {
        await axios.post(
          "http://localhost:5000/api/admin/categories",
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("Category added successfully");
      }

      setMessageType("success");
      setName("");
      setEditingCategory(null);
      setShowModal(false);
      fetchCategories();

    } catch (error) {
      console.error(error);
      setMessage("Operation failed");
      setMessageType("error");
    }

    setSubmitting(false);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Category deleted successfully");
      setMessageType("success");
      fetchCategories();
    } catch {
      setMessage("Delete failed");
      setMessageType("error");
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            📂 Category Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage all book categories in the platform
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setName("");
            setShowModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow"
        >
          + Add Category
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            messageType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center py-10 text-gray-500">
            No categories created yet
          </p>
        ) : (
          <table className="w-full">

            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Category Name</th>
                <th className="px-6 py-4 text-left">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>

              {categories.map((cat) => (
                <tr
                  key={cat._id}
                  className="border-b hover:bg-gray-50 transition"
                >

                  <td className="px-6 py-4 font-medium text-gray-800">
                    {cat.name}
                  </td>

                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(cat.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">

                    <button
                      onClick={() => openEditModal(cat)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(cat._id)}
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            <h3 className="text-xl font-semibold mb-4">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h3>

            <form onSubmit={handleSubmit}>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                className="w-full border px-3 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {submitting ? "Saving..." : editingCategory ? "Update" : "Add"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;