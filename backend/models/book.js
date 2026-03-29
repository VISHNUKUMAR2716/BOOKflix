// models/Book.js
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true, // ✅ Now required
    },

    pdf: {
      type: String,
      required: true,
    },

    audio: {
      type: String,
      default: null,
    },

    thumbnail: {
      type: String,
      default: "default-thumbnail.png",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    views: {
      type: Number,
      default: 0,
    },

    downloads: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "upcoming"],
      default: "pending",
    },


    ratings: [ratingSchema],

    averageRating: {
      type: Number,
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    releaseDate: {
      type: Date,
      default: null,
    },

    softDelete: {

      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
// ⭐ Auto calculate average rating
bookSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.totalRatings = this.ratings.length;
    this.averageRating = total / this.totalRatings;
  }
};

module.exports = mongoose.model("Book", bookSchema);
