const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

/**
 * @desc    Activate Subscription (Free/Instant)
 * @route   POST /api/payment/activate
 * @access  Private
 */
router.post("/activate", authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!["Basic", "Premium"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan selected." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const months = 1;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    user.subscription = {
      plan: plan,
      status: "active",
      startDate: startDate,
      endDate: endDate,
    };

    await user.save();

    res.json({ success: true, message: `Subscription for ${plan} plan activated successfully! 🎉` });
  } catch (error) {
    console.error("Error activating subscription:", error);
    res.status(500).json({ success: false, message: "Server error activating subscription." });
  }
});

module.exports = router;
