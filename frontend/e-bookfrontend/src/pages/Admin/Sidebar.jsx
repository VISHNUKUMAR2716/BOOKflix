import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Library, 
  FileEdit, 
  User, 
  Tag, 
  CheckSquare, 
  Globe, 
  TrendingUp,
  CalendarDays
} from "lucide-react";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Manage Books", path: "/admin/books", icon: <Library size={20} /> },
    { name: "Manage Posts", path: "/admin/posts", icon: <FileEdit size={20} /> },
    { name: "Manage Users", path: "/admin/users", icon: <User size={20} /> },
    { name: "Subscribers", path: "/admin/subscribers", icon: <CheckSquare size={20} /> },
    { name: "Manage Categories", path: "/admin/categories", icon: <Tag size={20} /> },
    { name: "Book Approval", path: "/admin/approval", icon: <CheckSquare size={20} /> },
    { name: "Upcoming Books", path: "/admin/upcoming", icon: <CalendarDays size={20} /> },
    { name: "Book translation", path: "/admin/translation", icon: <Globe size={20} /> },
    { name: "Analytics", path: "/admin/analytics", icon: <TrendingUp size={20} /> },
  ];


  return (
    <motion.div
      initial={{ x: -200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-72 min-h-screen bg-white text-gray-900 border-r border-gray-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      {/* Logo Area */}
      <div className="p-8 border-b border-gray-100/80">
        <div className="flex items-center mb-2">
          {/* Colorful Stacked Squares Logo */}
          <div className="relative w-8 h-8 mr-3">
            <div className="absolute top-0 left-0 w-4 h-4 bg-[#8FE25A] rounded-sm mix-blend-multiply"></div>
            <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-[#FF4D8B] rounded-sm mix-blend-multiply"></div>
            <div className="absolute top-3 left-3 w-4 h-4 bg-[#4A90E2] rounded-sm mix-blend-multiply"></div>
          </div>
          <h2 className="text-[26px] font-black tracking-tight text-black">
            Admin Panel
          </h2>
        </div>
        <p className="text-[13px] text-gray-400 tracking-wide font-medium ml-1">
          Book Management System
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 space-y-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-4 px-6 py-3.5 rounded-full border transition-all duration-200
                ${
                  isActive
                    ? "border-gray-300 bg-gray-50 text-black shadow-sm font-bold"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm font-semibold"
                }`}
              >
                <span className={`${isActive ? "text-black" : "text-gray-800"}`}>
                  {item.icon}
                </span>
                <span className="text-[15px]">{item.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 text-[11px] text-gray-400 font-medium text-center">
        <p>© 2026 Admin Dashboard</p>
      </div>
    </motion.div>
  );
}

export default Sidebar;