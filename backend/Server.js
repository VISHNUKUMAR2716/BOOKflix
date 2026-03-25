const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/book");
const postRoutes = require("./routes/posts");
const languageRoutes = require("./routes/language");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const { authMiddleware, adminOnly } = require("./middleware/auth");
const adminRoutes = require("./routes/admin");

const app = express();

/* =======================
   CREATE UPLOAD FOLDER IF NOT EXISTS
======================= */
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

/* =======================
   MIDDLEWARE
======================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   STATIC FOLDER
======================= */
app.use("/uploads", express.static(uploadPath));

/* =======================
   ROUTES
======================= */

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

app.use("/api/admin", authMiddleware, adminOnly, adminRoutes);

/* =======================
   PROTECTED ROUTES
======================= */
app.get("/api/admin", authMiddleware, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin" });
});

app.get("/api/user", authMiddleware, (req, res) => {
  res.json({ message: `Welcome ${req.user.role}` });
});

/* =======================
   HEALTH CHECK ROUTE
======================= */
app.get("/", (req, res) => {
  res.json({ message: "API is running successfully 🚀" });
});

/* =======================
   404 HANDLER
======================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =======================
   GLOBAL ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong",
    error: err.message,
  });
});

/* =======================
   DATABASE CONNECTION
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed ❌", err);
  });
