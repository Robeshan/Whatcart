import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../utils/middleware.js";

const router = Router();

// Middleware to check if user is admin
const adminMiddleware = (req: any, res: any, next: any) => {
  const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(req.userId) as any;
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Get overall platform stats
router.get("/stats/overview", authMiddleware, adminMiddleware, (req, res) => {
  try {
    // Total users
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;

    // Users by plan
    const usersByPlan = db.prepare(`
      SELECT p.name, COUNT(u.id) as count 
      FROM users u 
      LEFT JOIN packages p ON u.subscription_plan_id = p.id 
      GROUP BY p.id
    `).all() as any[];

    // Total messages sent this month
    const messagesThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM message_logs 
      WHERE DATE(created_at) >= date('now', 'start of month')
    `).get() as any;

    // Total revenue (sum of active subscriptions)
    const revenue = db.prepare(`
      SELECT SUM(p.price) as total FROM users u
      JOIN packages p ON u.subscription_plan_id = p.id
      WHERE u.billing_status IN ('active', 'trial')
    `).get() as any;

    // New users today
    const newUsersToday = db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE DATE(created_at) = DATE('now')
    `).get() as any;

    // Active users (logged in last 30 days)
    const activeUsers = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs
      WHERE action = 'user_login' 
      AND DATE(created_at) >= date('now', '-30 days')
      GROUP BY target_user_id
    `).all() as any[];

    res.json({
      total_users: totalUsers.count,
      new_users_today: newUsersToday.count,
      active_users: activeUsers.length,
      messages_this_month: messagesThisMonth.count,
      revenue_mrr: revenue.total || 0,
      users_by_plan: usersByPlan,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get revenue trend (last 12 months)
router.get("/stats/revenue-trend", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const trend = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        SUM(p.price) as revenue,
        COUNT(DISTINCT u.id) as users
      FROM users u
      JOIN packages p ON u.subscription_plan_id = p.id
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).all() as any[];

    res.json(trend);
  } catch (error) {
    console.error("Revenue trend error:", error);
    res.status(500).json({ error: "Failed to fetch revenue trend" });
  }
});

// Get user list for admin
router.get("/users", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const users = db.prepare(`
      SELECT u.id, u.email, u.name, u.phone, u.subscription_plan_id, 
             u.billing_status, u.created_at, p.name as plan, p.price,
             (SELECT COUNT(*) FROM message_logs WHERE user_id = u.id) as messages_sent
      FROM users u
      LEFT JOIN packages p ON u.subscription_plan_id = p.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];

    const total = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;

    res.json({
      users,
      total: total.count,
      page,
      pages: Math.ceil(total.count / limit),
    });
  } catch (error) {
    console.error("Users list error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get app performance metrics
router.get("/stats/performance", authMiddleware, adminMiddleware, (req, res) => {
  try {
    // Total WhatsApp messages sent
    const totalMessages = db.prepare("SELECT COUNT(*) as count FROM message_logs").get() as any;

    // Message delivery rate
    const deliveredMessages = db.prepare(
      "SELECT COUNT(*) as count FROM message_logs WHERE status IN ('delivered', 'read')"
    ).get() as any;

    // Shopify integrations
    const shopifyStores = db.prepare("SELECT COUNT(*) as count FROM shopify_stores").get() as any;

    // Abandoned carts detected
    const abandonedCarts = db.prepare("SELECT COUNT(*) as count FROM abandoned_carts WHERE recovery_attempted = 0").get() as any;

    // Conversion rate (recovered carts / total attempts)
    const recoveredCarts = db.prepare("SELECT COUNT(*) as count FROM abandoned_carts WHERE recovered_at IS NOT NULL").get() as any;

    res.json({
      total_messages: totalMessages.count,
      delivery_rate: totalMessages.count > 0 
        ? ((deliveredMessages.count / totalMessages.count) * 100).toFixed(2) + '%'
        : '0%',
      shopify_integrations: shopifyStores.count,
      abandoned_carts: abandonedCarts.count,
      recovered_carts: recoveredCarts.count,
      conversion_rate: abandonedCarts.count > 0
        ? ((recoveredCarts.count / abandonedCarts.count) * 100).toFixed(2) + '%'
        : '0%',
    });
  } catch (error) {
    console.error("Performance stats error:", error);
    res.status(500).json({ error: "Failed to fetch performance metrics" });
  }
});

// Send system notification to all users
router.post("/notifications/broadcast", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    // In a real app, this would send notifications via email or in-app system
    console.log(`[ADMIN BROADCAST] ${type || 'info'}: ${title} - ${message}`);

    res.json({ success: true, message: "Notification sent to all users" });
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;
