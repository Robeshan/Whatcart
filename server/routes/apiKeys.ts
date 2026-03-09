import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../utils/middleware.js";
import { generateApiKey } from "../utils/auth.js";

const router = Router();

// Create API Key
router.post("/", authMiddleware, (req, res) => {
  const { name } = req.body;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const apiKey = generateApiKey();

    const insert = db.prepare("INSERT INTO api_keys (user_id, key, name, is_active) VALUES (?, ?, ?, 1)");
    const result = insert.run(req.userId, apiKey, name || "API Key");

    res.status(201).json({
      id: result.lastInsertRowid,
      key: apiKey,
      name: name || "API Key",
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Create API key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List API Keys
router.get("/", authMiddleware, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const keys = db.prepare("SELECT id, name, is_active, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC").all(
      req.userId
    ) as any[];

    res.json(keys);
  } catch (error) {
    console.error("List API keys error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Revoke API Key
router.delete("/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify ownership
    const key = db.prepare("SELECT user_id FROM api_keys WHERE id = ?").get(id) as any;

    if (!key || key.user_id !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare("UPDATE api_keys SET is_active = 0 WHERE id = ?").run(id);

    // Log the action
    db.prepare("INSERT INTO audit_logs (admin_id, action, target_resource, details) VALUES (?, ?, ?, ?)").run(
      req.userId,
      "revoke_api_key",
      `api_keys:${id}`,
      "User revoked an API key"
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Revoke API key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
