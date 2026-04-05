import express from "express";
import db from "../db";

const router = express.Router();

// Get connection status for a user
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  try {
    const connection = db.prepare("SELECT * FROM connections WHERE user_id = ?").get(userId);
    res.json(connection || { whatsapp_status: 'disconnected', is_active: 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch connection status" });
  }
});

// Update Shopify connection
router.post("/shopify", (req, res) => {
  const { userId, shopifyUrl, shopifyToken } = req.body;
  try {
    const existing = db.prepare("SELECT id FROM connections WHERE user_id = ?").get(userId) as { id: number } | undefined;
    
    if (existing) {
      db.prepare("UPDATE connections SET shopify_url = ?, shopify_token = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
        .run(shopifyUrl, shopifyToken, userId);
    } else {
      db.prepare("INSERT INTO connections (user_id, shopify_url, shopify_token) VALUES (?, ?, ?)")
        .run(userId, shopifyUrl, shopifyToken);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Shopify connection" });
  }
});

// Update WhatsApp connection (simulated)
router.post("/whatsapp", (req, res) => {
  const { userId, status, phone } = req.body;
  try {
    const existing = db.prepare("SELECT id FROM connections WHERE user_id = ?").get(userId) as { id: number } | undefined;
    
    if (existing) {
      db.prepare("UPDATE connections SET whatsapp_status = ?, whatsapp_phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
        .run(status, phone, userId);
    } else {
      db.prepare("INSERT INTO connections (user_id, whatsapp_status, whatsapp_phone) VALUES (?, ?, ?)")
        .run(userId, status, phone);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update WhatsApp connection" });
  }
});

// Toggle Smart Recovery
router.post("/toggle", (req, res) => {
  const { userId, isActive } = req.body;
  try {
    db.prepare("UPDATE connections SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
      .run(isActive ? 1 : 0, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle Smart Recovery" });
  }
});

export default router;
