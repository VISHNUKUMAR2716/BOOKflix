const express = require("express");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/* ================= GET ALL USERS ================= */
// Used by the "People" tab in the user dashboard
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ role: "user", blocked: false })
      .select("-password")
      .populate("followers", "name photo")
      .populate("following", "name photo");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

/* ================= GET SINGLE USER PROFILE ================= */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name email photo bio")
      .populate("following", "name email photo bio")
      .populate("uploads");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

/* ================= FOLLOW / UNFOLLOW USER ================= */
router.put("/:id/follow", authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      isFollowing: !isFollowing,
      followers: targetUser.followers,
      following: currentUser.following,
    });
  } catch (error) {
    console.error("Error toggling follow:", error);
    res.status(500).json({ message: "Error toggling follow status" });
  }
});

/* ================= UPGRADE SUBSCRIPTION ================= */
router.post("/subscribe", authMiddleware, async (req, res) => {
  try {
    const { plan, durationMonths } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const months = durationMonths || 1;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    user.subscription = {
      plan: plan || "Premium",
      status: "active",
      startDate: startDate,
      endDate: endDate,
    };

    await user.save();

    res.json({ 
      success: true, 
      message: `Successfully subscribed to ${plan} plan!`,
      subscription: user.subscription
    });
  } catch (error) {
    console.error("Error activating subscription:", error);
    res.status(500).json({ message: "Error processing subscription" });
  }
});

module.exports = router;
