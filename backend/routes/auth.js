// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id.apps.googleusercontent.com");

// Multer for photo upload
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

/* ================= REGISTER ================= */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-assign admin role to first user if no admin exists
    let assignedRole = role || "user";
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      assignedRole = "admin";
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    await user.save();

    res.status(201).json({
      message: `User registered successfully${assignedRole === "admin" ? " as admin" : ""}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================= LOGIN ================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // ✅ CHECK IF USER IS BLOCKED - ISSUE #1 FIX
    if (user.blocked === true) {
      return res.status(403).json({
        message:
          "Your account has been blocked by an administrator. Please contact support.",
        blocked: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        blocked: user.blocked,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

/* ================= GOOGLE LOGIN ================= */

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "No Google token provided" });
    }

    // Debug: Log what client ID is being used
    const clientIdUsed = process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id.apps.googleusercontent.com";
    console.log("DEBUG: Backend GOOGLE_CLIENT_ID =", JSON.stringify(clientIdUsed));
    console.log("DEBUG: Client ID length =", clientIdUsed.length);
    
    // Decode token payload to see audience (without verification)
    try {
      const tokenParts = token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log("DEBUG: Token audience (aud) =", JSON.stringify(payload.aud));
      console.log("DEBUG: Token aud length =", payload.aud?.length);
      console.log("DEBUG: Do they match? =", payload.aud === clientIdUsed);
    } catch (decodeErr) {
      console.log("DEBUG: Could not decode token for inspection:", decodeErr.message);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: clientIdUsed,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    // Auto-assign admin role to first user if no admin exists
    let assignedRole = "user";
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      assignedRole = "admin";
    }

    if (!user) {
      // Create new user, scrambling a highly secure random password they won't use
      const generatedPassword = await bcrypt.hash(Math.random().toString(36).slice(-12) + Date.now().toString(), 10);
      
      user = new User({
        name,
        email,
        password: generatedPassword,
        role: assignedRole,
      });

      await user.save();
    }

    // CHECK IF USER IS BLOCKED
    if (user.blocked === true) {
      return res.status(403).json({
        message: "Your account has been blocked by an administrator. Please contact support.",
        blocked: true,
      });
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Google Login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        blocked: user.blocked,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed", error: error.message });
  }
});

/* ================= GET PROFILE ================= */

router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

/* ================= GET PROFILE BY ID ================= */

router.get("/profile/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

/* ================= UPDATE PROFILE ================= */

router.put(
  "/profile/:id",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      console.log("📝 UPDATE PROFILE REQUEST");
      console.log("User ID from token:", req.user.id);
      console.log("User ID from params:", id);
      console.log("Name:", name);
      console.log("Email:", email);
      console.log("Photo file:", req.file ? req.file.filename : "none");

      // Verify user is updating their own profile
      if (req.user.id.toString() !== id.toString()) {
        console.warn("❌ Unauthorized: User IDs don't match");
        return res
          .status(403)
          .json({ message: "Not authorized to update this profile" });
      }

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error("❌ Invalid MongoDB ObjectId:", id);
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const user = await User.findById(id);

      if (!user) {
        console.error("❌ User not found for ID:", id);
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is already taken (if email is being changed)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.warn("❌ Email already in use:", email);
          return res.status(400).json({ message: "Email already in use" });
        }
        user.email = email;
        console.log("✓ Email updated to:", email);
      }

      // Update name
      if (name) {
        user.name = name;
        console.log("✓ Name updated to:", name);
      }

      // Update photo if uploaded
      if (req.file) {
        user.photo = req.file.filename;
        console.log("✓ Photo updated to:", req.file.filename);
      }

      await user.save();
      console.log("✅ User profile saved successfully");

      const updatedUser = await User.findById(id).select("-password");

      res.json(updatedUser);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      res
        .status(500)
        .json({ message: "Error updating profile", error: error.message });
    }
  },
);

/* ================= DELETE ACCOUNT ================= */

router.delete("/profile/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️  DELETE ACCOUNT REQUEST");
    console.log("User ID from token:", req.user.id);
    console.log("User ID from params:", id);

    // Verify user is deleting their own account
    if (req.user.id.toString() !== id.toString()) {
      console.warn("❌ Unauthorized: User IDs don't match");
      return res
        .status(403)
        .json({ message: "Not authorized to delete this account" });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("❌ Invalid MongoDB ObjectId:", id);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      console.error("❌ User not found for ID:", id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User account deleted successfully");
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting account:", error);
    res
      .status(500)
      .json({ message: "Error deleting account", error: error.message });
  }
});

module.exports = router;
