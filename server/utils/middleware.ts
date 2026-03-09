import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth.js";
import rateLimit from "express-rate-limit";

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      email?: string;
    }
  }
}

// JWT Middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.userId = decoded.userId;
  req.email = decoded.email;
  next();
}

// Rate Limiting Middleware
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many API requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for webhooks
    return req.path.includes("/webhook");
  },
});

// API Key Middleware
export function apiKeyMiddleware(db: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      return res.status(401).json({ error: "No API key provided" });
    }

    try {
      const keyData = db.prepare("SELECT * FROM api_keys WHERE key = ? AND is_active = 1").get(apiKey) as any;

      if (!keyData) {
        return res.status(401).json({ error: "Invalid API key" });
      }

      // Update last used timestamp
      db.prepare("UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key = ?").run(apiKey);

      req.userId = keyData.user_id;
      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
