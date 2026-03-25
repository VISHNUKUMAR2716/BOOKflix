// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    photo: {
      type: String,
      default: "default-avatar.png",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    subscription: {
      plan: { type: String, enum: ["Free", "Basic", "Premium"], default: "Free" },
      status: { type: String, enum: ["active", "inactive"], default: "inactive" },
      startDate: Date,
      endDate: Date,
    },
    bio: {
      type: String,
      default: "",
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    booksViewed: [
      {
        book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    uploads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
