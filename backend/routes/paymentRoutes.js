const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { authMiddleware } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Initialize Razorpay
// Fallback to dummy keys if environment variables are not set
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey12345",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret_abc123",
});

/* ================= 1. CREATE ORDER ================= */
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    let amount = 0;

    // Convert INR to Paise (multiply by 100)
    if (plan === "Basic") {
      amount = 159 * 100;
    } else if (plan === "Premium") {
      amount = 199 * 100;
    } else {
      return res.status(400).json({ success: false, message: "Invalid plan selected." });
    }

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `rcptid_${req.user.id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: "Failed to create Razorpay Order." });
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey12345" // Give the frontend the Key ID
    });
  } catch (error) {
    console.error("Error creating Razorpay Order:", error);
    res.status(500).json({ success: false, message: "Server error generating order." });
  }
});

/* ================= 2. VERIFY PAYMENT ================= */
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET || "dummy_secret_abc123";

    // Create the expected signature using HMAC SHA256
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Valid payment! Upgrade the user
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const months = 1;
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

      return res.json({ success: true, message: "Payment Verified! Subscription Activated." });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Server error verifying payment." });
  }
});

module.exports = router;
