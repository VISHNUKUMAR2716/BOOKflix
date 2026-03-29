const Book = require("../models/book");
const User = require("../models/User");
const Category = require("../models/category");
const Post = require("../models/post");

// ================= BOOK APPROVAL =================
// ...existing code...

module.exports = {
  // ================= BOOK APPROVAL =================
  getPendingBooks: async (req, res) => {
    try {
      const books = await Book.find({ status: "pending" })
        .populate("category", "name")
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 });
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending books" });
    }
  },
  // ================= DASHBOARD =================
  getDashboardStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalBooks = await Book.countDocuments();
      const totalCategories = await Category.countDocuments();
      const blockedUsers = await User.countDocuments({ blocked: true });

      const mostViewedBooks = await Book.find()
        .sort({ views: -1 })
        .limit(5)
        .select("title views");

      const recentBooks = await Book.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title createdAt");

      res.json({
        totalUsers,
        totalBooks,
        totalCategories,
        blockedUsers,
        mostViewedBooks,
        recentBooks,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load dashboard stats" });
    }
  },

  // ================= USER MANAGEMENT =================

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  },

  getActiveSubscriptions: async (req, res) => {
    try {
      const subscribers = await User.find({ "subscription.status": "active" })
        .select("-password")
        .sort({ "subscription.startDate": -1 });
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Delete failed" });
    }
  },

  blockUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { blocked: true },
        { new: true },
      );

      res.json({ message: "User blocked", user });
    } catch (error) {
      res.status(500).json({ message: "Block failed" });
    }
  },

  unblockUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { blocked: false },
        { new: true },
      );

      res.json({ message: "User unblocked", user });
    } catch (error) {
      res.status(500).json({ message: "Unblock failed" });
    }
  },

  changeUserRole: async (req, res) => {
    try {
      const { role } = req.body;

      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true },
      );

      res.json({ message: "Role updated", user });
    } catch (error) {
      res.status(500).json({ message: "Role update failed" });
    }
  },

  // ================= BOOK MANAGEMENT =================

  getAllBooks: async (req, res) => {
    try {
      const books = await Book.find()
        .populate("category", "name")
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 });

      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  },

  addBook: async (req, res) => {
    try {
      const book = await Book.create(req.body);
      res.status(201).json({ message: "Book added", book });
    } catch (error) {
      res.status(500).json({ message: "Add book failed" });
    }
  },

  editBook: async (req, res) => {
    try {
      const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      res.json({ message: "Book updated", book });
    } catch (error) {
      res.status(500).json({ message: "Edit failed" });
    }
  },

  deleteBook: async (req, res) => {
    try {
      await Book.findByIdAndDelete(req.params.id);
      res.json({ message: "Book deleted" });
    } catch (error) {
      res.status(500).json({ message: "Delete failed" });
    }
  },

  bulkDeleteBooks: async (req, res) => {
    try {
      const { ids } = req.body;
      await Book.deleteMany({ _id: { $in: ids } });
      res.json({ message: "Books deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Bulk delete failed" });
    }
  },

  restoreBook: async (req, res) => {
    try {
      const book = await Book.findByIdAndUpdate(
        req.params.id,
        { softDelete: false },
        { new: true },
      );
      res.json({ message: "Book restored", book });
    } catch (error) {
      res.status(500).json({ message: "Restore failed" });
    }
  },

  getBookDetails: async (req, res) => {
    try {
      const book = await Book.findById(req.params.id)
        .populate("category")
        .populate("uploadedBy", "name email");

      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to get book details" });
    }
  },

  // ✅ ISSUE #3 FIX: Update status field instead of approved field
  approveBook: async (req, res) => {
    try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(404).json({ message: "Book not found" });

      let status = "approved";
      if (book.releaseDate && new Date(book.releaseDate) > new Date()) {
        status = "upcoming";
      }

      book.status = status;
      await book.save();

      const populatedBook = await Book.findById(book._id)
        .populate("category", "name")
        .populate("uploadedBy", "name email");

      res.status(200).json({
        message: `Book ${status === "upcoming" ? "scheduled" : "approved"} successfully`,
        book: populatedBook,
      });

    } catch (error) {
      console.error("Approve Book Error:", error);
      res
        .status(500)
        .json({ message: "Approval failed", error: error.message });
    }
  },

  rejectBook: async (req, res) => {
    try {
      const book = await Book.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true },
      )
        .populate("category", "name")
        .populate("uploadedBy", "name email");

      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.status(200).json({
        message: "Book rejected successfully",
        book,
      });
    } catch (error) {
      console.error("Reject Book Error:", error);
      res.status(500).json({ message: "Reject failed", error: error.message });
    }
  },

  scheduleBook: async (req, res) => {
    try {
      const { releaseDate } = req.body;
      if (!releaseDate) {
        return res.status(400).json({ message: "Release date is required" });
      }

      const book = await Book.findByIdAndUpdate(
        req.params.id,
        { 
          status: "upcoming",
          releaseDate: new Date(releaseDate)
        },
        { new: true },
      )
        .populate("category", "name")
        .populate("uploadedBy", "name email");

      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.status(200).json({
        message: "Book scheduled successfully",
        book,
      });
    } catch (error) {
      console.error("Schedule Book Error:", error);
      res.status(500).json({ message: "Scheduling failed", error: error.message });
    }
  },


  // ================= CATEGORY MANAGEMENT =================

  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find().sort({ createdAt: -1 });
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Fetch categories failed" });
    }
  },

  // ✅ ISSUE #2 FIX: Enhanced category creation with validation
  addCategory: async (req, res) => {
    try {
      const { name } = req.body;

      // Validate input
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          message: "Category name is required and must be a non-empty string",
        });
      }

      // Check for duplicate category
      const existingCategory = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
      });

      if (existingCategory) {
        return res.status(400).json({
          message: "Category already exists",
        });
      }

      // Create new category
      const category = await Category.create({
        name: name.trim(),
      });

      res.status(201).json({
        message: "Category added successfully",
        category,
        success: true,
      });
    } catch (error) {
      console.error("Add Category Error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Category already exists",
        });
      }
      res
        .status(500)
        .json({ message: "Add category failed", error: error.message });
    }
  },

  editCategory: async (req, res) => {
    try {
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );

      res.json({ message: "Category updated", category });
    } catch (error) {
      res.status(500).json({ message: "Edit category failed" });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      await Category.findByIdAndDelete(req.params.id);
      res.json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ message: "Delete category failed" });
    }
  },

  // ================= ANALYTICS =================

  getAnalytics: async (req, res) => {
    try {
      const booksPerCategory = await Book.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({ booksPerCategory });
    } catch (error) {
      res.status(500).json({ message: "Analytics failed" });
    }
  },

  // ================= SEARCH =================

  searchBooks: async (req, res) => {
    try {
      const { query } = req.query;

      const books = await Book.find({
        title: { $regex: query, $options: "i" },
      });

      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  },

  // ================= POST MANAGEMENT =================

  getAllPosts: async (req, res) => {
    try {
      const posts = await Post.find({ deleted: false })
        .populate("author", "name email photo")
        .populate("comments.user", "name email photo")
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (error) {
      console.error("Fetch posts error:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  },

  publishPost: async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { published: true },
        { new: true },
      )
        .populate("author", "name email photo")
        .populate("comments.user", "name email photo");

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.status(200).json({
        message: "Post published successfully",
        post,
      });
    } catch (error) {
      console.error("Publish post error:", error);
      res
        .status(500)
        .json({ message: "Failed to publish post", error: error.message });
    }
  },

  unpublishPost: async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { published: false },
        { new: true },
      )
        .populate("author", "name email photo")
        .populate("comments.user", "name email photo");

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.status(200).json({
        message: "Post unpublished successfully",
        post,
      });
    } catch (error) {
      console.error("Unpublish post error:", error);
      res
        .status(500)
        .json({ message: "Failed to unpublish post", error: error.message });
    }
  },

  deletePostAdmin: async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { deleted: true },
        { new: true },
      );

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.status(200).json({
        message: "Post deleted successfully",
        post,
      });
    } catch (error) {
      console.error("Delete post error:", error);
      res
        .status(500)
        .json({ message: "Failed to delete post", error: error.message });
    }
  },
};
