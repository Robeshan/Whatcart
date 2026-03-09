import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../utils/middleware.js";
import * as shopifyService from "../services/shopifyService.js";
import * as whatsappService from "../services/whatsappService.js";
import { logUsage } from "../services/usageService.js";

const router = Router();

// Shopify OAuth Callback
// User will be redirected here after authorizing in Shopify
router.get("/auth/callback", async (req: Request, res: Response) => {
  const { code, hmac, shop, state } = req.query;

  if (!code || !hmac || !shop) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // TODO: Verify HMAC and state for security
  // For now, this is a simplified version

  try {
    // This will need to be handled by the frontend
    // The frontend should store the code and exchange it with your backend
    res.json({
      success: true,
      message: "Authorization successful. Please complete the connection in your dashboard.",
      shop,
      code,
    });
  } catch (error) {
    console.error("[Shopify] OAuth callback error:", error);
    res.status(500).json({ error: "Authorization failed" });
  }
});

// Connect Shopify Store (after OAuth)
router.post("/connect", authMiddleware, async (req: Request, res: Response) => {
  const { shopName, accessToken } = req.body;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!shopName || !accessToken) {
    return res.status(400).json({ error: "Shop name and access token are required" });
  }

  try {
    // Verify the connection by fetching shop details
    const config = {
      shopName: shopName.replace(".myshopify.com", ""),
      accessToken,
    };

    const shop = await shopifyService.getShopDetails(config);

    if (!shop) {
      return res.status(400).json({ error: "Invalid Shopify credentials" });
    }

    // Store the connection
    const insert = db.prepare(
      "INSERT INTO shopify_stores (user_id, shop_name, access_token) VALUES (?, ?, ?)"
    );
    const result = insert.run(req.userId, config.shopName, accessToken);

    const storeId = result.lastInsertRowid;

    // Create webhooks for abandoned carts
    try {
      const webhookUrl = `${process.env.APP_URL}/api/shopify/webhook`;

      // Subscribe to checkout created
      const webhook1 = await shopifyService.createWebhook(config, "checkouts/create", webhookUrl);
      db.prepare("INSERT INTO shopify_webhooks (shopify_store_id, webhook_id, topic, address) VALUES (?, ?, ?, ?)")
        .run(storeId, webhook1.id, "checkouts/create", webhookUrl);

      // Subscribe to checkout updated
      const webhook2 = await shopifyService.createWebhook(config, "checkouts/update", webhookUrl);
      db.prepare("INSERT INTO shopify_webhooks (shopify_store_id, webhook_id, topic, address) VALUES (?, ?, ?, ?)")
        .run(storeId, webhook2.id, "checkouts/update", webhookUrl);

      // Subscribe to orders/create (for recovery tracking)
      const webhook3 = await shopifyService.createWebhook(config, "orders/create", webhookUrl);
      db.prepare("INSERT INTO shopify_webhooks (shopify_store_id, webhook_id, topic, address) VALUES (?, ?, ?, ?)")
        .run(storeId, webhook3.id, "orders/create", webhookUrl);
    } catch (webhookError) {
      console.warn("[Shopify] Warning: Could not create some webhooks", webhookError);
      // Don't fail if webhooks fail, connection is still valid
    }

    // Log the action
    db.prepare("INSERT INTO audit_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)")
      .run(req.userId, "connect_shopify_store", req.userId, `Connected to store: ${config.shopName}`);

    logUsage(req.userId, "/api/shopify/connect", "POST", 200);

    res.status(201).json({
      success: true,
      message: "Shopify store connected successfully",
      storeId,
      shopName: config.shopName,
    });
  } catch (error: any) {
    console.error("[Shopify] Connection error:", error);
    res.status(400).json({
      error: error.message || "Failed to connect Shopify store",
    });
  }
});

// Get Connected Stores
router.get("/stores", authMiddleware, (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const stores = db.prepare("SELECT * FROM shopify_stores WHERE user_id = ? AND is_active = 1").all(
      req.userId
    ) as any[];

    res.json(stores);
  } catch (error) {
    console.error("[Shopify] Error fetching stores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Single Store Details
router.get("/stores/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const store = db.prepare("SELECT * FROM shopify_stores WHERE id = ? AND user_id = ?").get(id, req.userId);

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json(store);
  } catch (error) {
    console.error("[Shopify] Error fetching store:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Disconnect Store
router.delete("/stores/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const store = db.prepare("SELECT * FROM shopify_stores WHERE id = ? AND user_id = ?").get(id, req.userId) as any;

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Delete webhooks
    try {
      const webhooks = db.prepare("SELECT * FROM shopify_webhooks WHERE shopify_store_id = ?").all(id) as any[];

      const config = {
        shopName: store.shop_name,
        accessToken: store.access_token,
      };

      for (const webhook of webhooks) {
        await shopifyService.deleteWebhook(config, webhook.webhook_id);
      }
    } catch (error) {
      console.warn("[Shopify] Warning: Could not delete some webhooks", error);
    }

    // Mark store as inactive
    db.prepare("UPDATE shopify_stores SET is_active = 0 WHERE id = ?").run(id);

    // Log the action
    db.prepare("INSERT INTO audit_logs (admin_id, action, target_user_id, details) VALUES (?, ?, ?, ?)")
      .run(req.userId, "disconnect_shopify_store", req.userId, `Disconnected store: ${store.shop_name}`);

    res.json({ success: true });
  } catch (error) {
    console.error("[Shopify] Disconnect error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Abandoned Carts
router.get("/abandoned-carts", authMiddleware, (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const status = req.query.status as string || "abandoned";

    const carts = db.prepare(`
      SELECT 
        ac.*,
        ss.shop_name
      FROM abandoned_carts ac
      LEFT JOIN shopify_stores ss ON ac.shopify_store_id = ss.id
      WHERE ac.user_id = ? AND ac.status = ?
      ORDER BY ac.created_at DESC
      LIMIT ?
    `)
    .all(req.userId, status, limit) as any[];

    // Parse cart items
    const formattedCarts = carts.map((cart) => ({
      ...cart,
      cart_items: cart.cart_items ? JSON.parse(cart.cart_items) : [],
    }));

    res.json(formattedCarts);
  } catch (error) {
    console.error("[Shopify] Error fetching abandoned carts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Webhook Handler (Shopify events)
router.post("/webhook", async (req: Request, res: Response) => {
  // Always return 200 to acknowledge receipt
  res.status(200).send("OK");

  try {
    const topic = req.headers["x-shopify-topic"] as string;
    const shop = req.headers["x-shopify-shop-api"] as string;
    const body = req.body;

    console.log(`[Shopify Webhook] Topic: ${topic}, Shop: ${shop}`);

    // Find the store in our database
    const store = db.prepare("SELECT * FROM shopify_stores WHERE shop_name = ?").get(shop) as any;

    if (!store) {
      console.warn("[Shopify] Webhook received for unknown store:", shop);
      return;
    }

    // Handle checkout created (potential abandoned cart)
    if (topic === "checkouts/create") {
      await handleCheckoutCreated(body, store);
    }

    // Handle checkout updated (could be abandoned or recovery)
    if (topic === "checkouts/update") {
      await handleCheckoutUpdated(body, store);
    }

    // Handle order created (confirms recovery worked)
    if (topic === "orders/create") {
      await handleOrderCreated(body, store);
    }
  } catch (error) {
    console.error("[Shopify] Webhook error:", error);
  }
});

// Handle checkout created
async function handleCheckoutCreated(checkoutData: any, store: any) {
  try {
    const checkout = checkoutData.checkout;

    if (!shopifyService.isCheckoutAbandoned(checkout)) {
      return; // Not an abandoned cart yet
    }

    const phone = shopifyService.extractPhoneFromCheckout(checkout);
    const email = shopifyService.extractEmailFromCheckout(checkout);
    const cartTotal = shopifyService.getCheckoutTotal(checkout);
    const cartItems = shopifyService.extractCartItems(checkout);

    // Only process if we have a phone number
    if (!phone) {
      console.log("[Shopify] Checkout has no phone, skipping:", checkout.id);
      return;
    }

    // Store the abandoned cart
    const insert = db.prepare(`
      INSERT INTO abandoned_carts 
      (user_id, shopify_store_id, shopify_checkout_id, customer_name, customer_email, customer_phone, cart_items, cart_total, checkout_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      store.user_id,
      store.id,
      checkout.id,
      shopifyService.extractNameFromCheckout(checkout),
      email,
      phone,
      JSON.stringify(cartItems),
      cartTotal,
      checkout.admin_graphql_api_id,
      "abandoned"
    );

    console.log(`[Shopify] Abandoned cart detected: ${checkout.id} from ${phone}`);
  } catch (error) {
    console.error("[Shopify] Error handling checkout created:", error);
  }
}

// Handle checkout updated
async function handleCheckoutUpdated(checkoutData: any, store: any) {
  try {
    const checkout = checkoutData.checkout;

    // Check if this cart was already recorded
    const existingCart = db.prepare("SELECT id FROM abandoned_carts WHERE shopify_checkout_id = ?").get(
      checkout.id
    ) as any;

    if (!existingCart) {
      // New checkout, process as created
      await handleCheckoutCreated(checkoutData, store);
    }
  } catch (error) {
    console.error("[Shopify] Error handling checkout updated:", error);
  }
}

// Handle order created (recovery confirmed)
async function handleOrderCreated(orderData: any, store: any) {
  try {
    const order = orderData.order;

    // Find the abandoned cart that matches this order
    const cart = db.prepare("SELECT id FROM abandoned_carts WHERE shopify_checkout_id = ?").get(
      order.checkout_id
    ) as any;

    if (cart) {
      // Mark as recovered
      db.prepare("UPDATE abandoned_carts SET status = ?, recovered_at = ? WHERE id = ?").run(
        "recovered",
        new Date().toISOString(),
        cart.id
      );

      console.log(`[Shopify] Cart recovered! Order: ${order.id}`);
    }
  } catch (error) {
    console.error("[Shopify] Error handling order created:", error);
  }
}

// Manual Recovery Trigger (Admin/User can manually send message)
router.post("/recover/:cartId", authMiddleware, async (req: Request, res: Response) => {
  const { cartId } = req.params;

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const cart = db.prepare("SELECT * FROM abandoned_carts WHERE id = ? AND user_id = ?").get(
      cartId,
      req.userId
    ) as any;

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (cart.recovery_message_sent) {
      return res.status(400).json({ error: "Recovery message already sent for this cart" });
    }

    // Get user's settings
    const user = db.prepare("SELECT subscription_plan_id FROM users WHERE id = ?").get(req.userId) as any;
    const plan = db.prepare("SELECT * FROM packages WHERE id = ?").get(user.subscription_plan_id) as any;

    // Generate recovery message
    const message = shopifyService.getRecoveryMessageTemplate(
      cart.customer_name || "Friend",
      cart.cart_total,
      "SAVE10"
    );

    // Send WhatsApp message
    const result = await whatsappService.sendSimpleMessage(cart.customer_phone, message);

    if (result.success) {
      // Update cart with message sent
      db.prepare("UPDATE abandoned_carts SET recovery_message_sent = 1, message_id = ?, updated_at = ? WHERE id = ?")
        .run(result.messageId || "sent", new Date().toISOString(), cartId);

      logUsage(req.userId, "/api/shopify/recover", "POST", 200, 1, 1);

      res.json({
        success: true,
        message: "Recovery message sent",
        messageId: result.messageId,
      });
    } else {
      logUsage(req.userId, "/api/shopify/recover", "POST", 400, 0, 0);

      res.status(400).json({
        success: false,
        error: result.error || "Failed to send message",
      });
    }
  } catch (error) {
    console.error("[Shopify] Recovery error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
