import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* User Pages */
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import UserSettings from "./pages/UserSettings";
import CreatePost from "./pages/CreatePost";
import UploadedBooks from "./pages/UploadedBooks";
import UserUpload from "./pages/UserUpload";
import FlipBook from "./pages/Flipbook";
import Return from "./pages/Return";
import UserProfile from "./pages/UserProfile";
import Subscription from "./pages/Subscription";
import Payment from "./pages/Payment";


/* Admin Pages */
import DashboardHome from "./pages/Admin/DashboardHome";
import ManageBooks from "./pages/Admin/ManageBooks";
import ManagePosts from "./pages/Admin/ManagePosts";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageCategories from "./pages/Admin/ManageCategories";
import Analytics from "./pages/Admin/Analytics";
import BookApproval from "./pages/Admin/BookApproval";
import ManageTranslations from "./pages/Admin/ManageTranslations";
import AdminLayout from "./pages/Admin/AdminBooks";
import Subscribers from "./pages/Admin/Subscribers";


/* ================= ADMIN PROTECTION ================= */

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}


/* ================= USER PROTECTION ================= */

function UserProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "user") {
    return <Navigate to="/" replace />;
  }

  return children;
}


/* ================= APP ROUTER ================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* ================= USER ROUTES ================= */}

        <Route
          path="/user"
          element={
            <UserProtectedRoute>
              <UserDashboard />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <UserProtectedRoute>
              <UserSettings />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/create-post"
          element={
            <UserProtectedRoute>
              <CreatePost />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/return"
          element={
            <UserProtectedRoute>
              <Return />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/userupload"
          element={
            <UserProtectedRoute>
              <UserUpload />
            </UserProtectedRoute>
          }
        />
        
        <Route
          path="/profile/:id"
          element={
            <UserProtectedRoute>
              <UserProfile />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/read"
          element={
            <UserProtectedRoute>
              <FlipBook />
            </UserProtectedRoute>
          }
        />
        
        <Route
          path="/subscription"
          element={
            <UserProtectedRoute>
              <Subscription />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/payment/:plan"
          element={
            <UserProtectedRoute>
              <Payment />
            </UserProtectedRoute>
          }
        />


        {/* ================= ADMIN ROUTES ================= */}

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="books" element={<ManageBooks />} />
          <Route path="posts" element={<ManagePosts />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="approval" element={<BookApproval />} />
          <Route path="translation" element={<ManageTranslations />} />
          <Route path="subscribers" element={<Subscribers />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;