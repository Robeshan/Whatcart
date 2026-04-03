import { Router } from "express";
import db from "../db.js";

const router = Router();

// Register
router.post("/register", (req, res) => {
  const { email, password, phone } = req.body;
  
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const insert = db.prepare("INSERT INTO users (email, password, phone, verification_code) VALUES (?, ?, ?, ?)");
    const result = insert.run(email, password, phone, verificationCode);
    
    // In a real app, you would send the SMS here
    console.log(`Verification code for ${phone}: ${verificationCode}`);
    
    res.json({ id: result.lastInsertRowid, message: "Registration successful. Please verify your phone." });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify Phone
router.post("/verify", (req, res) => {
  const { email, code } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_code = ?").get(email) as any;
  
  if (user) {
    db.prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?").run(user.id);
    res.json({ success: true, message: "Account verified successfully" });
  } else {
    res.status(400).json({ error: "Invalid verification code" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
  
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  if (!user.is_verified) {
    return res.status(403).json({ error: "Please verify your phone number first" });
  }
  
  res.json({ id: user.id, email: user.email, phone: user.phone });
});

// Forgot Password
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (user) {
    const resetToken = Math.random().toString(36).substring(2, 15);
    db.prepare("UPDATE users SET reset_token = ? WHERE id = ?").run(resetToken, user.id);
    // In a real app, send email with reset link
    console.log(`Reset token for ${email}: ${resetToken}`);
  }
  
  res.json({ message: "If an account exists with that email, a reset link has been sent." });
});

// Reset Password
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE reset_token = ?").get(token) as any;
  
  if (user) {
    db.prepare("UPDATE users SET password = ?, reset_token = NULL WHERE id = ?").run(newPassword, user.id);
    res.json({ success: true, message: "Password reset successfully" });
  } else {
    res.status(400).json({ error: "Invalid or expired reset token" });
  }
});

export default router;
