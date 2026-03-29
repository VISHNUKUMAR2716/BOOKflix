const Book = require("../models/book");
const User = require("../models/User");
const Category = require("../models/category");

// Upload Book (Admin Only)
exports.uploadBook = async (req, res) => {
  try {
    const { title, author, category, releaseDate } = req.body;
    if (!title || !author || !category) {
      return res
        .status(400)
        .json({ message: "Title, Author and Category are required" });
    }
    if (!req.files?.pdf) {
      return res.status(400).json({ message: "PDF file is required" });
    }
    
    // Determine status: if releaseDate is in the future, it's upcoming
    let status = "approved";
    if (releaseDate && new Date(releaseDate) > new Date()) {
      status = "upcoming";
    }

    const newBook = new Book({
      title,
      author,
      category,
      pdf: req.files.pdf[0].filename,
      audio: req.files.audio ? req.files.audio[0].filename : null,
      thumbnail: req.files.thumbnail
        ? req.files.thumbnail[0].filename
        : "default-thumbnail.png",
      uploadedBy: req.user.id,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      status,
    });

    await newBook.save();
    res.status(201).json({ message: "Book uploaded successfully" });
  } catch (error) {
    console.error("Upload Book Error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// Upload Book (Authenticated Users)
exports.userUploadBook = async (req, res) => {
  try {
    const { title, author, category, releaseDate } = req.body;

    if (!title || !author || !category) {
      return res
        .status(400)
        .json({ message: "Title, Author and Category are required" });
    }

    if (!req.files?.pdf) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const newBook = new Book({
      title,
      author,
      category,
      pdf: req.files.pdf[0].filename,
      audio: req.files.audio ? req.files.audio[0].filename : null,
      thumbnail: req.files.thumbnail
        ? req.files.thumbnail[0].filename
        : "default-thumbnail.png",
      uploadedBy: req.user.id,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      status: "pending", // User uploads are pending until admin approves
    });


    await newBook.save();
    res.status(201).json({
      message: "Book uploaded successfully. Pending admin approval.",
      book: newBook,
    });
  } catch (error) {
    console.error("User Upload Book Error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// Approve/Reject Book (Admin Only)
exports.approveBook = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    book.status = status;
    await book.save();
    res.json({ message: `Book ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Approval failed" });
  }
};

// Like/Unlike Book
exports.likeBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    const userId = req.user.id;
    if (book.likes.includes(userId)) {
      book.likes = book.likes.filter((id) => id.toString() !== userId);
    } else {
      book.likes.push(userId);
    }
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Like failed" });
  }
};

// Rate Book
exports.rateBook = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    const userId = req.user.id;
    // Remove previous rating by user
    book.ratings = book.ratings.filter((r) => r.user.toString() !== userId);
    // Add new rating
    book.ratings.push({ user: userId, rating, comment });
    book.calculateAverageRating();
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Rating failed" });
  }
};

// Increment View Count
exports.incrementView = async (req, res) => {
  try {
    console.log(`Incrementing views for book: ${req.params.id}`);
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    book.views += 1;
    await book.save();
    console.log(`Book views incremented to: ${book.views}`);
    res.json({ views: book.views });
  } catch (err) {
    console.error("Error incrementing views:", err.message);
    res
      .status(500)
      .json({ message: "View increment failed", error: err.message });
  }
};

// Increment Download Count
exports.incrementDownload = async (req, res) => {
  try {
    console.log(`Incrementing downloads for book: ${req.params.id}`);
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    book.downloads += 1;
    await book.save();
    console.log(`Book downloads incremented to: ${book.downloads}`);
    res.json({ downloads: book.downloads });
  } catch (err) {
    console.error("Error incrementing downloads:", err.message);
    res
      .status(500)
      .json({ message: "Download increment failed", error: err.message });
  }
};

// Soft Delete Book (Admin Only)
exports.softDeleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { softDelete: true },
      { new: true },
    );
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting book" });
  }
};

// Get Approved Books
exports.getApprovedBooks = async (req, res) => {
  try {
    const books = await Book.find({ status: "approved", softDelete: false })
      .populate("category", "name")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Error fetching approved books" });
  }
};
