const express = require("express");
const aiController = require("../controllers/aiController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Only authenticated users can use AI features
router.post("/continue", authMiddleware, aiController.continueStory);

module.exports = router;
