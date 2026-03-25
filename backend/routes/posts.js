const express = require("express");
const multer = require("multer");
const path = require("path");
const Post = require("../models/post");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Multer configuration for photos and videos
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|avi|mov|mkv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

/* ================= CREATE POST ================= */

router.post("/create", authMiddleware, upload.any(), async (req, res) => {
  try {
    const { title, content, published } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    const images = [];
    const videos = [];

    if (req.files) {
      req.files.forEach((file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
          images.push(file.filename);
        } else if ([".mp4", ".avi", ".mov", ".mkv"].includes(ext)) {
          videos.push(file.filename);
        }
      });
    }

    const post = new Post({
      author: req.user.id,
      title,
      content,
      images,
      videos,
      published: published === "true" || published === true,
    });

    await post.save();
    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name email photo",
    );

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res
      .status(500)
      .json({ message: "Error creating post", error: error.message });
  }
});

/* ================= GET ALL PUBLISHED POSTS ================= */

router.get("/feed", async (req, res) => {
  try {
    const posts = await Post.find({ published: true, deleted: false })
      .populate("author", "name email photo")
      .populate("comments.user", "name email photo")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

/* ================= GET USER'S POSTS ================= */

router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId, deleted: false })
      .populate("author", "name email photo")
      .populate("comments.user", "name email photo")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Error fetching user posts" });
  }
});

/* ================= GET SINGLE POST ================= */

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email photo")
      .populate("comments.user", "name email photo");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Error fetching post" });
  }
});

/* ================= UPDATE POST ================= */

router.put("/:id", authMiddleware, upload.any(), async (req, res) => {
  try {
    const { title, content, published } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (published !== undefined)
      post.published = published === "true" || published === true;

    // Handle new uploads
    if (req.files) {
      req.files.forEach((file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
          post.images.push(file.filename);
        } else if ([".mp4", ".avi", ".mov", ".mkv"].includes(ext)) {
          post.videos.push(file.filename);
        }
      });
    }

    await post.save();
    const updatedPost = await Post.findById(post._id).populate(
      "author",
      "name email photo",
    );

    res.json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Error updating post" });
  }
});

/* ================= DELETE POST ================= */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    post.deleted = true;
    await post.save();

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
});

/* ================= LIKE POST ================= */

router.put("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user.id.toString(),
      );
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    const updatedPost = await Post.findById(post._id).populate(
      "author",
      "name email photo",
    );

    res.json(updatedPost);
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Error liking post" });
  }
});

/* ================= ADD COMMENT ================= */

router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user.id,
      text,
    });

    await post.save();
    const updatedPost = await Post.findById(post._id)
      .populate("author", "name email photo")
      .populate("comments.user", "name email photo");

    res.json(updatedPost);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
});

/* ================= INCREMENT VIEW COUNT ================= */

router.put("/:id/view", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.views += 1;
    await post.save();

    res.json({ views: post.views });
  } catch (error) {
    console.error("Error incrementing views:", error);
    res.status(500).json({ message: "Error incrementing views" });
  }
});

/* ================= SHARE POST ================= */

router.put("/:id/share", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.shares += 1;
    await post.save();

    res.json({ shares: post.shares });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ message: "Error sharing post" });
  }
});

module.exports = router;
