
import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= DELETE USER ================= */
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;

    await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchUsers();
  };

  /* ================= BLOCK / UNBLOCK ================= */
  const toggleBlock = async (user) => {
    const url = user.blocked
      ? `http://localhost:5000/api/admin/users/${user._id}/unblock`
      : `http://localhost:5000/api/admin/users/${user._id}/block`;

    await axios.put(
      url,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchUsers();
  };

  /* ================= CHANGE ROLE ================= */
  const changeRole = async (id, role) => {
    const newRole = role === "admin" ? "user" : "admin";

    await axios.put(
      `http://localhost:5000/api/admin/users/${id}/role`,
      { role: newRole },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchUsers();
  };

  /* ================= SEARCH FILTER ================= */
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-8">

      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          👥 User Management
        </h1>
        <p className="text-gray-500">
          Manage platform users, roles and permissions
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-indigo-600">
            {users.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Active Users</p>
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => !u.blocked).length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Blocked Users</p>
          <p className="text-3xl font-bold text-red-600">
            {users.filter((u) => u.blocked).length}
          </p>
        </div>

      </div>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <input
          type="text"
          placeholder="🔍 Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">

        <table className="w-full text-left">

          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Uploads</th>
              <th className="px-6 py-4 text-center">Viewed</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 text-gray-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b hover:bg-gray-50 transition"
                >

                  {/* USER INFO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>

                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      {user.role}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4 text-center">
                    {user.blocked ? (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                        Active
                      </span>
                    )}
                  </td>

                  {/* UPLOADS */}
                  <td className="px-6 py-4 text-center">
                    {user.uploads?.length || 0}
                  </td>

                  {/* VIEWED */}
                  <td className="px-6 py-4 text-center">
                    {user.booksViewed?.length || 0}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right space-x-2">

                    <button
                      onClick={() => toggleBlock(user)}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                    >
                      {user.blocked ? "Unblock" : "Block"}
                    </button>

                    <button
                      onClick={() => changeRole(user._id, user.role)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Change Role
                    </button>

                    <button
                      onClick={() => deleteUser(user._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Delete
                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>
    </div>
  );
};

export default ManageUsers;