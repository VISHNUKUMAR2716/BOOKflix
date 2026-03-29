import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function ManageTranslations() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/languages/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLanguages(res.data);
    } catch (err) {
      setError("Failed to fetch languages.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = async (id) => {
    try {
      const res = await axios.put(
        `https://bookflix-1-o3od.onrender.com/api/languages/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLanguages(prev =>
        prev.map(lang => lang._id === id ? res.data.language : lang)
      );
    } catch (err) {
      console.error("Error toggling language", err);
      setError("Failed to update status.");
    }
  };

  const addLanguage = async (e) => {
    e.preventDefault();
    if (!newName || !newCode) return setError("Name and code are required.");

    setError("");
    setSuccessMsg("");
    try {
      const res = await axios.post(
        "https://bookflix-1-o3od.onrender.com/api/languages",
        { name: newName, code: newCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLanguages(prev => [...prev, res.data.language].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewCode("");
      setSuccessMsg("Language added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add language.");
    }
  };

  const deleteLanguage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this language completely?")) return;

    try {
      await axios.delete(`https://bookflix-1-o3od.onrender.com/api/languages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLanguages(prev => prev.filter(lang => lang._id !== id));
      setSuccessMsg("Language deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error deleting language", err);
      setError("Failed to delete language.");
    }
  };

  if (loading) return <div className="p-8">Loading languages...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Translation Languages 🌍</h1>
      <p className="text-gray-600 mb-8 max-w-full">
        Add, delete, or toggle languages available for users to translate books into.
        Only active languages will show up in the Book Reader dropdown.
      </p>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-4 shadow-sm border  border-red-100">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded mb-4 shadow-sm border border-green-100">{successMsg}</div>}

      {/* ADD LANGUAGE FORM */}
      <form onSubmit={addLanguage} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-4 items-end max-w-full">
        <div className="flex-1 max-w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Language Name</label>
          <input
            type="text"
            placeholder="e.g. Italian"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Language Code</label>
          <input
            type="text"
            placeholder="e.g. it"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition h-[42px]">
          + Add
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
              <th className="p-4">Language Name</th>
              <th className="p-4">Short Code</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((lang, index) => (
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={lang._id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="p-4 font-medium text-gray-800">{lang.name}</td>
                <td className="p-4 text-sm text-gray-500 font-mono">{lang.code.toUpperCase()}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${lang.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {lang.isActive ? "ACTIVE" : "DISABLED"}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => toggleLanguage(lang._id)}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${lang.isActive ? 'bg-gray-200 hover:bg-yellow-100 hover:text-yellow-700 text-gray-700' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}
                  >
                    {lang.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => deleteLanguage(lang._id)}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded text-sm font-semibold transition"
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
