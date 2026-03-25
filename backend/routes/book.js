const express = require("express");
const multer = require("multer");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const Book = require("../models/book");
const Category = require("../models/category");
const bookController = require("../controllers/bookController");
const recommendationController = require("../controllers/recommendationController");

const router = express.Router();


// =======================
// Multer Storage
// =======================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});


// =====================================================
// PUBLIC ROUTES (ALWAYS FIRST)
// =====================================================

// ✅ Get All Categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error("Category Error:", err);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// ✅ Get Approved Books
router.get("/approved", bookController.getApprovedBooks);

// ✅ Get All Books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find({ softDelete: false })
      .populate("category", "name")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(books);
  } catch (err) {
    console.error("Books Fetch Error:", err);
    res.status(500).json({ message: "Error fetching books" });
  }
});


// =====================================================
// ADMIN ROUTES
// =====================================================

// ✅ Admin Stats
router.get("/admin/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ softDelete: false });
    const books = await Book.find();
    const totalLikes = books.reduce(
      (sum, book) => sum + (book.likes?.length || 0),
      0
    );

    res.json({ totalBooks, totalLikes });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});


// =====================================================
// UPLOAD ROUTES
// =====================================================

// ✅ Admin Upload
router.post(
  "/upload",
  authMiddleware,
  adminOnly,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  bookController.uploadBook
);

// ✅ User Upload
router.post(
  "/user-upload",
  authMiddleware,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  bookController.userUploadBook
);


// ✅ Get Recommendations
router.get("/recommendations", authMiddleware, recommendationController.getRecommendations);


// =====================================================
// ACTION ROUTES (MUST COME BEFORE /:id)
// =====================================================

router.put("/:id/approve", authMiddleware, adminOnly, bookController.approveBook);
router.put("/:id/like", authMiddleware, bookController.likeBook);
router.put("/:id/rate", authMiddleware, bookController.rateBook);
router.put("/:id/view", bookController.incrementView);
router.put("/:id/download", bookController.incrementDownload);
router.delete("/:id", authMiddleware, adminOnly, bookController.softDeleteBook);


// =====================================================
// GET SINGLE BOOK (ALWAYS LAST)
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("category", "name")
      .populate("uploadedBy", "name email");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(book);
  } catch (err) {
    console.error("Single Book Error:", err);
    res.status(500).json({ message: "Error fetching book" });
  }
});


module.exports = router;