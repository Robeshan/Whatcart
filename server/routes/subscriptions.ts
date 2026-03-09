import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../utils/middleware.js";
import { logUsage } from "../services/usageService.js";

const router = Router();

// Get user's current subscription
router.get("/current", authMiddleware, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = db.prepare(
      "SELECT subscription_plan_id, trial_ends_at, billing_status FROM users WHERE id = ?"
    ).get(req.userId) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = db.prepare("SELECT * FROM packages WHERE id = ?").get(user.subscription_plan_id) as any;

    const data = {
      plan_id: user.subscription_plan_id,
      plan_name: plan?.name,
      price: plan?.price,
      features: plan?.features ? JSON.parse(plan.features) : [],
      billing_status: user.billing_status,
      trial_ends_at: user.trial_ends_at,
      message_limit: plan?.message_limit_monthly,
      recovery_limit: plan?.recovery_limit_monthly,
    };

    res.json(data);
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upgrade/Downgrade subscription
router.post("/upgrade", authMiddleware, (req, res) => {
  const { planId } = req.body;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!planId) {
    return res.status(400).json({ error: "Plan ID is required" });
  }

  try {
    // Verify plan exists
    const plan = db.prepare("SELECT * FROM packages WHERE id = ? AND active = 1").get(planId) as any;

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const user = db.prepare("SELECT subscription_plan_id FROM users WHERE id = ?").get(req.userId) as any;

    // Update user's subscription
    db.prepare("UPDATE users SET subscription_plan_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      planId,
      req.userId
    );

    // Log the action
    db.prepare("INSERT INTO audit_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)").run(
      req.userId,
      "upgrade_subscription",
      req.userId,
      `Upgraded from plan ${user.subscription_plan_id} to plan ${planId}`
    );

    // Log usage
    logUsage(req.userId, "/api/subscriptions/upgrade", "POST", 200);

    res.json({
      success: true,
      message: "Subscription upgraded successfully",
      new_plan: plan.name,
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start free trial
router.post("/start-trial", authMiddleware, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = db.prepare("SELECT trial_ends_at FROM users WHERE id = ?").get(req.userId) as any;

    if (user.trial_ends_at) {
      return res.status(400).json({ error: "User already has a trial or trial has expired" });
    }

    // Start 14-day trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    db.prepare("UPDATE users SET trial_ends_at = ? WHERE id = ?").run(trialEnd, req.userId);

    // Log the action
    db.prepare("INSERT INTO audit_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)").run(
      req.userId,
      "start_trial",
      req.userId,
      "User started a 14-day free trial"
    );

    res.json({
      success: true,
      message: "Free trial started",
      trial_ends_at: trialEnd.toISOString(),
    });
  } catch (error) {
    console.error("Start trial error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all available plans (public endpoint)
router.get("/plans", (req, res) => {
  try {
    const plans = db.prepare("SELECT * FROM packages WHERE active = 1 ORDER BY price ASC").all() as any[];

    const formattedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      features: p.features ? JSON.parse(p.features) : [],
      popular: p.popular === 1,
      message_limit: p.message_limit_monthly,
      recovery_limit: p.recovery_limit_monthly,
      max_templates: p.max_templates,
    }));

    res.json(formattedPlans);
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
