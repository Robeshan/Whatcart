import { Router } from "express";
import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production-use-strong-random-key";

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register
router.post("/register", async (req, res) => {
  const { username, email, mobile_number, password } = req.body;
  
  try {
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Check if email already exists
    const checkEmail = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const insert = await db.query(
      "INSERT INTO users (username, email, mobile_number, password, otp) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [username, email, mobile_number, hashedPassword, otp]
    );

    // Send OTP to user's email
    await transporter.sendMail({
      from: `"Whatcart" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your account - OTP",
      text: `Your OTP for registration is: ${otp}`,
    });
    
    res.json({ id: insert.rows[0].id, message: "Registration successful. Please verify your OTP sent to email." });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const userResult = await db.query("SELECT * FROM users WHERE email = $1 AND otp = $2", [email, otp]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await db.query("UPDATE users SET is_verified = true, otp = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);
      res.json({ success: true, message: "Account verified successfully" });
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const identifier = req.body.identifier || req.body.email;
  const { password } = req.body;
  console.log(`Login attempt for identifier: '${identifier}'`);
  
  try {
    const userResult = await db.query("SELECT * FROM users WHERE email = $1 OR mobile_number = $1", [identifier]);
    
    if (userResult.rows.length === 0) {
      console.log(`User not found for identifier: '${identifier}'`);
      return res.status(401).json({ error: "Invalid credentials (User not found)" });
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_verified) {
      console.log(`User found but not verified. Email: ${user.email}`);
      return res.status(403).json({ error: "Please verify your email via OTP first" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`User found, verified, but invalid password provided for: ${user.email}`);
      return res.status(401).json({ error: "Invalid credentials (Bad password)" });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`Successful login for: ${user.email}`);
    res.json({ token, id: user.id, email: user.email, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User Profile
router.get("/profile", authenticateToken, async (req: any, res: any) => {
  try {
    const userResult = await db.query("SELECT id, username, email, mobile_number, is_verified, created_at, updated_at FROM users WHERE id = $1", [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
