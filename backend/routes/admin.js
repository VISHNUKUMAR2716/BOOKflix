const express = require("express");
const adminController = require("../controllers/adminController");
const { authMiddleware, isAdmin } = require("../middleware/auth");
const router = express.Router();

// Book Approval routes
router.get(
  "/books/pending",
  authMiddleware,
  isAdmin,
  adminController.getPendingBooks,
);
router.put(
  "/books/:id/approve",
  authMiddleware,
  isAdmin,
  adminController.approveBook,
);
router.put(
  "/books/:id/reject",
  authMiddleware,
  isAdmin,
  adminController.rejectBook,
);

// Dashboard stats
router.get(
  "/dashboard",
  authMiddleware,
  isAdmin,
  adminController.getDashboardStats,
);

// Book management
router.get("/books", authMiddleware, isAdmin, adminController.getAllBooks);
router.post("/books", authMiddleware, isAdmin, adminController.addBook);
router.put("/books/:id", authMiddleware, isAdmin, adminController.editBook);
router.delete(
  "/books/:id",
  authMiddleware,
  isAdmin,
  adminController.deleteBook,
);
router.post(
  "/books/bulk-delete",
  authMiddleware,
  isAdmin,
  adminController.bulkDeleteBooks,
);
router.put(
  "/books/:id/restore",
  authMiddleware,
  isAdmin,
  adminController.restoreBook,
);
router.get(
  "/books/:id",
  authMiddleware,
  isAdmin,
  adminController.getBookDetails,
);
router.put(
  "/books/:id/approve",
  authMiddleware,
  isAdmin,
  adminController.approveBook,
);
router.put(
  "/books/:id/reject",
  authMiddleware,
  isAdmin,
  adminController.rejectBook,
);

router.put(
  "/books/:id/schedule",
  authMiddleware,
  isAdmin,
  adminController.scheduleBook,
);

// User management

router.get("/users", authMiddleware, isAdmin, adminController.getAllUsers);
router.delete(
  "/users/:id",
  authMiddleware,
  isAdmin,
  adminController.deleteUser,
);
router.put(
  "/users/:id/block",
  authMiddleware,
  isAdmin,
  adminController.blockUser,
);
router.put(
  "/users/:id/unblock",
  authMiddleware,
  isAdmin,
  adminController.unblockUser,
);
router.put(
  "/users/:id/role",
  authMiddleware,
  isAdmin,
  adminController.changeUserRole,
);

// Subscription management
router.get("/subscriptions", authMiddleware, isAdmin, adminController.getActiveSubscriptions);

// Category management
router.get(
  "/categories",
  authMiddleware,
  isAdmin,
  adminController.getAllCategories,
);
router.post(
  "/categories",
  authMiddleware,
  isAdmin,
  adminController.addCategory,
);
router.put(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  adminController.editCategory,
);
router.delete(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  adminController.deleteCategory,
);

// ✅ POST MANAGEMENT ROUTES
/* ================= POST MANAGEMENT ================= */

router.get(
  "/posts",
  authMiddleware,
  isAdmin,
  adminController.getAllPosts
);

router.put(
  "/posts/:id/publish",
  authMiddleware,
  isAdmin,
  adminController.publishPost
);

router.put(
  "/posts/:id/unpublish",
  authMiddleware,
  isAdmin,
  adminController.unpublishPost
);

router.delete(
  "/posts/:id",
  authMiddleware,
  isAdmin,
  adminController.deletePostAdmin
);
// Analytics
router.get("/analytics", authMiddleware, isAdmin, adminController.getAnalytics);

// Search & filter
router.get("/search", authMiddleware, isAdmin, adminController.searchBooks);

module.exports = router;
