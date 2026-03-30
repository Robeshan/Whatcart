import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "7d";

// Hash Password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

// Compare Password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

// Generate JWT Token
export function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
}

// Verify JWT Token
export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Generate Verification Code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate Reset Token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate API Key
export function generateApiKey(): string {
  return "wc_" + crypto.randomBytes(32).toString("hex");
}

// Get Token Expiry Time (15 minutes from now)
export function getTokenExpiry(minutesFromNow: number = 15): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
  return expiry.toISOString();
}
