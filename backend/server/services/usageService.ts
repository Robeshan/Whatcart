import db from "../db.js";

export interface UsageStats {
  messagesThisMonth: number;
  recoveriesThisMonth: number;
  messagesLimit: number | null;
  recoveriesLimit: number | null;
  isOverLimit: boolean;
}

// Get user's current usage stats
export function getUserUsageStats(userId: number): UsageStats {
  try {
    // Get user's subscription plan
    const user = db.prepare("SELECT subscription_plan_id FROM users WHERE id = ?").get(userId) as any;

    if (!user) {
      throw new Error("User not found");
    }

    // Get plan limits
    const plan = db.prepare(
      "SELECT message_limit_monthly, recovery_limit_monthly FROM packages WHERE id = ?"
    ).get(user.subscription_plan_id) as any;

    // Get current month's usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = db.prepare(`
      SELECT 
        COALESCE(SUM(messages_sent), 0) as messages,
        COALESCE(SUM(recoveries_triggered), 0) as recoveries
      FROM usage_logs
      WHERE user_id = ? 
      AND timestamp >= ?
      AND timestamp <= ?
    `)
    .get(userId, monthStart.toISOString(), monthEnd.toISOString()) as any;

    const messagesThisMonth = usage.messages || 0;
    const recoveriesThisMonth = usage.recoveries || 0;
    const messagesLimit = plan?.message_limit_monthly;
    const recoveriesLimit = plan?.recovery_limit_monthly;

    // Check if over limits (null means unlimited)
    const isOverLimitMessages = messagesLimit !== null && messagesThisMonth >= messagesLimit;
    const isOverLimitRecoveries = recoveriesLimit !== null && recoveriesThisMonth >= recoveriesLimit;
    const isOverLimit = isOverLimitMessages || isOverLimitRecoveries;

    return {
      messagesThisMonth,
      recoveriesThisMonth,
      messagesLimit,
      recoveriesLimit,
      isOverLimit,
    };
  } catch (error) {
    console.error("Error getting usage stats:", error);
    return {
      messagesThisMonth: 0,
      recoveriesThisMonth: 0,
      messagesLimit: null,
      recoveriesLimit: null,
      isOverLimit: false,
    };
  }
}

// Log API usage
export function logUsage(
  userId: number,
  endpoint: string,
  method: string,
  statusCode: number,
  messagesSent: number = 0,
  recoveriesTriggered: number = 0
) {
  try {
    db.prepare(`
      INSERT INTO usage_logs 
      (user_id, api_endpoint, method, status_code, messages_sent, recoveries_triggered)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, endpoint, method, statusCode, messagesSent, recoveriesTriggered);
  } catch (error) {
    console.error("Error logging usage:", error);
  }
}

// Check if user can perform action based on limits
export function canUserPerformAction(
  userId: number,
  actionType: "send_message" | "start_recovery"
): { allowed: boolean; reason?: string } {
  const usage = getUserUsageStats(userId);

  if (actionType === "send_message") {
    if (usage.messagesLimit !== null && usage.messagesThisMonth >= usage.messagesLimit) {
      return {
        allowed: false,
        reason: `Message limit reached (${usage.messagesThisMonth}/${usage.messagesLimit})`,
      };
    }
  }

  if (actionType === "start_recovery") {
    if (usage.recoveriesLimit !== null && usage.recoveriesThisMonth >= usage.recoveriesLimit) {
      return {
        allowed: false,
        reason: `Recovery limit reached (${usage.recoveriesThisMonth}/${usage.recoveriesLimit})`,
      };
    }
  }

  return { allowed: true };
}

// Get all users' usage (admin function)
export function getAllUsersUsage(limit: number = 100) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const results = db.prepare(`
      SELECT 
        u.id,
        u.email,
        p.name as plan_name,
        COALESCE(SUM(ul.messages_sent), 0) as messages_this_month,
        COALESCE(SUM(ul.recoveries_triggered), 0) as recoveries_this_month,
        p.message_limit_monthly,
        p.recovery_limit_monthly
      FROM users u
      LEFT JOIN packages p ON u.subscription_plan_id = p.id
      LEFT JOIN usage_logs ul ON u.id = ul.user_id 
        AND ul.timestamp >= ?
        AND ul.timestamp <= ?
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ?
    `)
    .all(monthStart.toISOString(), monthEnd.toISOString(), limit) as any[];

    return results;
  } catch (error) {
    console.error("Error getting all users usage:", error);
    return [];
  }
}
