const express = require("express");
const Language = require("../models/Language");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();

const DEFAULT_LANGUAGES = [
  { name: "Spanish", code: "es", isActive: true },
  { name: "French", code: "fr", isActive: true },
  { name: "German", code: "de", isActive: true },
  { name: "Hindi", code: "hi", isActive: true },
  { name: "Chinese", code: "zh", isActive: true },
  { name: "Arabic", code: "ar", isActive: true },
  { name: "Russian", code: "ru", isActive: true },
];

// Initialize default languages if none exist
const initLanguages = async () => {
  try {
    const count = await Language.countDocuments();
    if (count === 0) {
      await Language.insertMany(DEFAULT_LANGUAGES);
    }
  } catch (err) {
    console.error("Error initializing languages:", err);
  }
};
initLanguages();

// Get ALL Languages (for Admin)
router.get("/all", authMiddleware, adminOnly, async (req, res) => {
  try {
    const languages = await Language.find().sort({ name: 1 });
    res.json(languages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching languages" });
  }
});

// Get ACTIVE Languages (for Users)
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const languages = await Language.find({ isActive: true }).sort({ name: 1 });
    res.json(languages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching active languages" });
  }
});

// Toggle Language Status (Admin only)
router.put("/:id/toggle", authMiddleware, adminOnly, async (req, res) => {
  try {
    const lang = await Language.findById(req.params.id);
    if (!lang) return res.status(404).json({ message: "Language not found" });

    lang.isActive = !lang.isActive;
    await lang.save();

    res.json({ message: "Language status updated", language: lang });
  } catch (err) {
    res.status(500).json({ message: "Error toggling language" });
  }
});

// Add New Language (Admin only)
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: "Name and code are required" });

    // Check if code already exists
    const existing = await Language.findOne({ code: code.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Language code already exists" });

    const newLang = new Language({
      name: name.trim(),
      code: code.trim().toLowerCase(),
      isActive: true
    });

    await newLang.save();
    res.status(201).json({ message: "Language added successfully", language: newLang });
  } catch (err) {
    console.error("Error adding language:", err);
    res.status(500).json({ message: "Error adding language" });
  }
});

// Delete Language (Admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const lang = await Language.findByIdAndDelete(req.params.id);
    if (!lang) return res.status(404).json({ message: "Language not found" });
    res.json({ message: "Language deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: "Error deleting language" });
  }
});

module.exports = router;
