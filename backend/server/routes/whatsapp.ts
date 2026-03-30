import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../utils/middleware.js";
import {
  sendRecoveryMessage,
  sendSimpleMessage,
  markMessageAsRead,
  verifyWebhookToken,
  sendWhatsAppMessage,
} from "../services/whatsappService.js";
import { logUsage } from "../services/usageService.js";

const router = Router();

// Send Recovery Message (User endpoint)
router.post("/send-recovery", authMiddleware, async (req, res) => {
  const { phoneNumber, customerName, cartTotal, discountCode } = req.body;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validation
  if (!phoneNumber || !customerName || !cartTotal) {
    return res.status(400).json({ error: "Phone number, customer name, and cart total are required" });
  }

  try {
    // Check usage limits
    const user = db.prepare("SELECT subscription_plan_id FROM users WHERE id = ?").get(req.userId) as any;
    const plan = db.prepare("SELECT message_limit_monthly FROM packages WHERE id = ?").get(user.subscription_plan_id) as any;

    if (plan?.message_limit_monthly) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usage = db.prepare(
        "SELECT COUNT(*) as count FROM message_logs WHERE user_id = ? AND created_at >= ? AND created_at <= ?"
      ).get(req.userId, monthStart.toISOString(), monthEnd.toISOString()) as any;

      if (usage.count >= plan.message_limit_monthly) {
        return res.status(429).json({
          error: "Message limit reached for this month",
          limit: plan.message_limit_monthly,
          used: usage.count,
        });
      }
    }

    // Send message
    const result = await sendRecoveryMessage(phoneNumber, customerName, cartTotal, discountCode || "SAVE10");

    if (result.success) {
      // Log message
      const logInsert = db.prepare(`
        INSERT INTO message_logs 
        (user_id, whatsapp_message_id, phone_number, customer_name, cart_total, discount_code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      logInsert.run(
        req.userId,
        result.messageId || "pending",
        phoneNumber,
        customerName,
        cartTotal,
        discountCode || "SAVE10",
        "sent",
        new Date().toISOString()
      );

      // Log usage
      logUsage(req.userId, "/api/whatsapp/send-recovery", "POST", 200, 1, 0);

      res.json({
        success: true,
        message: "Recovery message sent successfully",
        messageId: result.messageId,
      });
    } else {
      logUsage(req.userId, "/api/whatsapp/send-recovery", "POST", 400, 0, 0);

      res.status(400).json({
        success: false,
        error: result.error || "Failed to send message",
      });
    }
  } catch (error) {
    console.error("Send recovery message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send Custom Text Message
router.post("/send-message", authMiddleware, async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "Phone number and message are required" });
  }

  try {
    const result = await sendSimpleMessage(phoneNumber, message);

    if (result.success) {
      // Log message
      db.prepare(`
        INSERT INTO message_logs 
        (user_id, whatsapp_message_id, phone_number, message_body, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.userId, result.messageId || "pending", phoneNumber, message, "sent", new Date().toISOString());

      logUsage(req.userId, "/api/whatsapp/send-message", "POST", 200, 1, 0);

      res.json({ success: true, messageId: result.messageId });
    } else {
      logUsage(req.userId, "/api/whatsapp/send-message", "POST", 400, 0, 0);
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Webhook Verification (GET)
// Meta will call this to verify your webhook
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token) {
    if (verifyWebhookToken(token)) {
      console.log("[WhatsApp Webhook] Verified successfully");
      res.status(200).send(challenge);
    } else {
      console.warn("[WhatsApp Webhook] Invalid verification token");
      res.status(403).json({ error: "Invalid verification token" });
    }
  } else {
    res.status(400).json({ error: "Missing or invalid parameters" });
  }
});

// Webhook Events (POST)
// WhatsApp sends incoming messages and status updates here
router.post("/webhook", (req: Request, res: Response) => {
  const body = req.body;

  console.log("[WhatsApp Webhook] Received event:", JSON.stringify(body, null, 2));

  // Always return 200 to acknowledge receipt
  res.status(200).send("EVENT_RECEIVED");

  try {
    // Check if this is a message event
    if (body.object !== "whatsapp_business_account") {
      return;
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Handle incoming messages
    if (value?.messages) {
      const message = value.messages[0];
      const phoneNumber = message.from;
      const messageText = message.text?.body || "";
      const messageId = message.id;

      console.log(`[WhatsApp Webhook] Incoming message from ${phoneNumber}: ${messageText}`);

      // Log incoming message
      try {
        db.prepare(`
          INSERT INTO message_logs 
          (phone_number, message_body, status, direction, whatsapp_message_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(phoneNumber, messageText, "received", "inbound", messageId, new Date().toISOString());
      } catch (error) {
        console.error("Error logging incoming message:", error);
      }

      // Mark message as read
      markMessageAsRead(messageId);
    }

    // Handle status updates
    if (value?.statuses) {
      const status = value.statuses[0];
      const messageId = status.id;
      const statusType = status.status; // sent, delivered, read, failed

      console.log(`[WhatsApp Webhook] Message ${messageId} status: ${statusType}`);

      // Update message status
      try {
        db.prepare("UPDATE message_logs SET status = ? WHERE whatsapp_message_id = ?").run(statusType, messageId);
      } catch (error) {
        console.error("Error updating message status:", error);
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing event:", error);
  }
});

// Get Message History (User endpoint)
router.get("/history", authMiddleware, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = db.prepare(`
      SELECT * FROM message_logs 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(req.userId, limit, offset) as any[];

    const total = db.prepare("SELECT COUNT(*) as count FROM message_logs WHERE user_id = ?").get(
      req.userId
    ) as any;

    res.json({
      messages,
      total: total.count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get message history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Message Stats (User endpoint)
router.get("/stats", authMiddleware, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM message_logs 
      WHERE user_id = ?
      AND created_at >= ?
      AND created_at <= ?
    `)
    .get(req.userId, monthStart.toISOString(), monthEnd.toISOString()) as any;

    res.json({
      period: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      },
      stats: {
        total_messages: stats.total_messages || 0,
        sent: stats.sent || 0,
        delivered: stats.delivered || 0,
        read: stats.read || 0,
        failed: stats.failed || 0,
      },
    });
  } catch (error) {
    console.error("Get message stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
