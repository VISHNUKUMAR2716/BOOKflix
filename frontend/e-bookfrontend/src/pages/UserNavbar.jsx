import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  FiMenu,
  FiLogOut,
  FiUpload,
  FiSettings,
  FiEdit,
  FiArrowLeft,
  FiCalendar,
} from "react-icons/fi";

export default function UserNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [isOpen, setIsOpen] = useState(true);

  const [user, setUser] = useState({
    name: localStorage.getItem("name") || "User",
    photo: null,
  });

  /* ================= FETCH USER PROFILE ================= */

  useEffect(() => {
    if (!userId || !token) return;

    axios
      .get(`http://localhost:5000/api/auth/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser({
          name: res.data.name,
          photo: res.data.photo,
        });

        localStorage.setItem("name", res.data.name);
      })
      .catch((err) => {
        console.error("Profile fetch failed", err);
      });
  }, []);

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ================= ACTIVE MENU ================= */

  const menuItem = (path) =>
    `flex items-center ${
      isOpen ? "justify-start gap-3" : "justify-center"
    } px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
      location.pathname === path
        ? "bg-indigo-600 text-white"
        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
    }`;

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 80 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-r shadow-lg flex flex-col justify-between min-h-screen"
    >
      {/* ================= TOP ================= */}

      <div>
        {/* Toggle */}

        <div
          className={`flex items-center ${
            isOpen ? "justify-between" : "justify-center"
          } p-4 border-b `}
        >
          {isOpen && (
            <h2 className="text-lg font-semibold text-gray-700 ">Dashboard</h2>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xl text-gray-600"
          >
            <FiMenu />
          </button>
        </div>

        {/* ================= PROFILE ================= */}

        {isOpen && (
          <div className="flex flex-col items-center py-6 border-b bg-gradient-to-tr from-green-300 to-blue-300">
            <div className="w-20 h-20 rounded-full overflow-hidden border shadow">
              {user.photo ? (
                <img
                  src={`http://localhost:5000/uploads/${user.photo}`}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h3 className="mt-3 font-semibold text-gray-700">{user.name}</h3>
            <p className="text-sm text-gray-500">User Dashboard</p>
          </div>
        )}

        {/* ================= MENU ================= */}

        <nav className="flex flex-col gap-2 p-4">
          <Link to="/create-post" className={menuItem("/create-post")}>
            <FiEdit size={20} />
            {isOpen && <span>Create Post</span>}
          </Link>

          <Link to="/userupload" className={menuItem("/userupload")}>
            <FiUpload size={20} />
            {isOpen && <span>Upload Books</span>}
          </Link>

          <Link to="/upcoming" className={menuItem("/upcoming")}>
            <FiCalendar size={20} />
            {isOpen && <span>Upcoming</span>}
          </Link>

          <Link to="/settings" className={menuItem("/settings")}>
            <FiSettings size={20} />
            {isOpen && <span>Settings</span>}
          </Link>

          <Link to="/return" className={menuItem("/return")}>
            <FiArrowLeft size={20} />
            {isOpen && <span>Manual Doc</span>}
          </Link>
        </nav>
      </div>

      {/* ================= LOGOUT ================= */}

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className={`flex items-center ${
            isOpen ? "justify-start gap-3" : "justify-center"
          } w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition`}
        >
          <FiLogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}