import { Router } from "express";
import db from "../db.js";
import { hashPassword, generateVerificationCode, getTokenExpiry, generateToken, comparePassword, generateResetToken, generateApiKey } from "../utils/auth.js";
import { authRateLimiter, authMiddleware } from "../utils/middleware.js";

const router = Router();

// Register
router.post("/register", authRateLimiter, async (req, res) => {
  const { email, password, phone } = req.body;

  // Validation
  if (!email || !password || !phone) {
    return res.status(400).json({ error: "Email, password, and phone are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const verificationCode = generateVerificationCode();
    const codeExpiry = getTokenExpiry(15); // 15 minutes

    const insert = db.prepare(
      "INSERT INTO users (email, password, phone, verification_code, verification_code_expiry, subscription_plan_id) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const result = insert.run(email, hashedPassword, phone, verificationCode, codeExpiry, 1); // 1 = Starter plan

    // TODO: Send SMS with verification code (integrate Twilio or similar)
    console.log(`[VERIFICATION] Code for ${phone}: ${verificationCode}`);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: "Registration successful. Please verify your phone.",
    });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify Email
router.post("/verify", authRateLimiter, (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_code = ?").get(email, code) as any;
  
  if (!user) {
    return res.status(400).json({ error: "Invalid verification code" });
  }

  // Check if code expired
  const codeExpiry = new Date(user.verification_code_expiry);
  if (codeExpiry < new Date()) {
    return res.status(400).json({ error: "Verification code expired. Please request a new one." });
  }

  try {
    db.prepare("UPDATE users SET is_verified = 1, verification_code = NULL, verification_code_expiry = NULL WHERE id = ?").run(
      user.id
    );

    const token = generateToken(user.id, user.email);

    // Get subscription plan details
    const plan = db.prepare("SELECT * FROM packages WHERE id = ?").get(user.subscription_plan_id) as any;

    res.json({
      success: true,
      message: "Account verified successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        phone: user.phone,
        plan: plan?.name?.toLowerCase() || 'free',
        subscription_status: user.billing_status || 'active',
        is_admin: user.is_admin === 1,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    const token = generateToken(user.id, user.email);

    // Get subscription plan details
    const plan = db.prepare("SELECT * FROM packages WHERE id = ?").get(user.subscription_plan_id) as any;

    // Log the login action
    db.prepare("INSERT INTO audit_logs (action, target_user_id, details) VALUES (?, ?, ?)").run(
      "user_login",
      user.id,
      `User logged in from IP: ${req.ip}`
    );

    // Count API keys and shopify stores
    const apiKeyCount = db.prepare("SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?").get(user.id) as any;
    const shopifyStoresCount = db.prepare("SELECT COUNT(*) as count FROM shopify_stores WHERE user_id = ?").get(user.id) as any;
    const messagesSent = db.prepare("SELECT COUNT(*) as count FROM message_logs WHERE user_id = ?").get(user.id) as any;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        phone: user.phone,
        plan: plan?.name?.toLowerCase() || 'free',
        subscription_status: user.billing_status || 'active',
        trial_ends_at: user.trial_ends_at,
        is_admin: user.is_admin === 1,
        api_key_count: apiKeyCount?.count || 0,
        shopify_stores_count: shopifyStoresCount?.count || 0,
        messages_sent: messagesSent?.count || 0,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request Password Reset
router.post("/forgot-password", authRateLimiter, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    // Always return success for security (don't reveal if email exists)
    if (user) {
      const resetToken = generateResetToken();
      const tokenExpiry = getTokenExpiry(60); // 60 minutes

      db.prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?").run(resetToken, tokenExpiry, user.id);

      // TODO: Send email with reset link
      // This should include: https://yourapp.com/reset-password?token={resetToken}
      console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
    }

    res.json({
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset Password
router.post("/reset-password", authRateLimiter, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE reset_token = ?").get(token) as any;

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Check if token expired
    const tokenExpiry = new Date(user.reset_token_expiry);
    if (tokenExpiry < new Date()) {
      return res.status(400).json({ error: "Reset token expired. Please request a new one." });
    }

    const hashedPassword = await hashPassword(newPassword);

    db.prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?").run(
      hashedPassword,
      user.id
    );

    // Log the password reset
    db.prepare("INSERT INTO audit_logs (action, target_user_id, details) VALUES (?, ?, ?)").run(
      "password_reset",
      user.id,
      "User reset their password"
    );

    res.json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Current User (requires auth)
router.get("/me", authMiddleware, (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get subscription plan details
    const plan = db.prepare("SELECT * FROM packages WHERE id = ?").get(user.subscription_plan_id) as any;

    // Count API keys and shopify stores
    const apiKeyCount = db.prepare("SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?").get(user.id) as any;
    const shopifyStoresCount = db.prepare("SELECT COUNT(*) as count FROM shopify_stores WHERE user_id = ?").get(user.id) as any;
    const messagesSent = db.prepare("SELECT COUNT(*) as count FROM message_logs WHERE user_id = ?").get(user.id) as any;

    res.json({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      phone: user.phone,
      plan: plan?.name?.toLowerCase() || 'free',
      subscription_status: user.billing_status || 'active',
      trial_ends_at: user.trial_ends_at,
      is_admin: user.is_admin === 1,
      api_key_count: apiKeyCount?.count || 0,
      shopify_stores_count: shopifyStoresCount?.count || 0,
      messages_sent: messagesSent?.count || 0,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resend Verification Code
router.post("/resend-verification", authRateLimiter, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: "User is already verified" });
    }

    const verificationCode = generateVerificationCode();
    const codeExpiry = getTokenExpiry(15);

    db.prepare("UPDATE users SET verification_code = ?, verification_code_expiry = ? WHERE id = ?").run(
      verificationCode,
      codeExpiry,
      user.id
    );

    // TODO: Send SMS with verification code
    console.log(`[VERIFICATION] New code for ${user.phone}: ${verificationCode}`);

    res.json({
      message: "Verification code sent to your phone.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
