import express from "express";
import db from "../db.js";

const router = express.Router();

// Get connection status for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const connection = await db.query("SELECT * FROM connections WHERE user_id = $1", [userId]);
    res.json(connection.rows[0] || { whatsapp_status: 'disconnected', is_active: false });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch connection status" });
  }
});

// Update Shopify connection
router.post("/shopify", async (req, res) => {
  const { userId, shopifyUrl, shopifyToken } = req.body;
  try {
    const existing = await db.query("SELECT id FROM connections WHERE user_id = $1", [userId]);
    
    if (existing.rows.length > 0) {
      await db.query(
        "UPDATE connections SET shopify_url = $1, shopify_token = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3",
        [shopifyUrl, shopifyToken, userId]
      );
    } else {
      await db.query(
        "INSERT INTO connections (user_id, shopify_url, shopify_token) VALUES ($1, $2, $3)",
        [userId, shopifyUrl, shopifyToken]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Shopify connection" });
  }
});

// Update WhatsApp connection (simulated)
router.post("/whatsapp", async (req, res) => {
  const { userId, status, phone } = req.body;
  try {
    const existing = await db.query("SELECT id FROM connections WHERE user_id = $1", [userId]);
    
    if (existing.rows.length > 0) {
      await db.query(
        "UPDATE connections SET whatsapp_status = $1, whatsapp_phone = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3",
        [status, phone, userId]
      );
    } else {
      await db.query(
        "INSERT INTO connections (user_id, whatsapp_status, whatsapp_phone) VALUES ($1, $2, $3)",
        [userId, status, phone]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update WhatsApp connection" });
  }
});

// Toggle Smart Recovery
router.post("/toggle", async (req, res) => {
  const { userId, isActive } = req.body;
  try {
    await db.query(
      "UPDATE connections SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [!!isActive, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle Smart Recovery" });
  }
});

export default router;
