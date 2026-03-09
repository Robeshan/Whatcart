import axios, { AxiosError } from "axios";
import crypto from "crypto";

const SHOPIFY_API_VERSION = "2024-01";

export interface ShopifyConfig {
  shopName: string;
  accessToken: string;
  apiVersion?: string;
}

// Validate Shopify HMAC (webhook security)
export function validateShopifyHmac(
  req: any,
  shopifyApiSecret: string
): boolean {
  const hmac = req.headers["x-shopify-hmac-sha256"];
  const body = req.rawBody || ""; // Raw body needed for valid HMAC

  if (!hmac) return false;

  const hash = crypto
    .createHmac("sha256", shopifyApiSecret)
    .update(body, "utf8")
    .digest("base64");

  return hash === hmac;
}

// Build Shopify API URL
function getShopifyUrl(shopName: string, apiVersion: string = SHOPIFY_API_VERSION): string {
  return `https://${shopName}.myshopify.com/admin/api/${apiVersion}`;
}

// Fetch abandoned checkout details
export async function getCheckoutDetails(
  config: ShopifyConfig,
  checkoutId: string
): Promise<any> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/checkouts/${checkoutId}.json`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
      },
    });

    return response.data.checkout;
  } catch (error) {
    console.error("[Shopify] Error fetching checkout:", error);
    throw error;
  }
}

// Fetch shop details (to verify connection)
export async function getShopDetails(config: ShopifyConfig): Promise<any> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/shop.json`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
      },
    });

    return response.data.shop;
  } catch (error) {
    console.error("[Shopify] Error fetching shop details:", error);
    throw error;
  }
}

// Create webhook
export async function createWebhook(
  config: ShopifyConfig,
  topic: string,
  address: string
): Promise<any> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/webhooks.json`;

    const response = await axios.post(
      url,
      {
        webhook: {
          topic,
          address,
          format: "json",
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": config.accessToken,
        },
      }
    );

    return response.data.webhook;
  } catch (error) {
    console.error("[Shopify] Error creating webhook:", error);
    throw error;
  }
}

// Delete webhook
export async function deleteWebhook(
  config: ShopifyConfig,
  webhookId: string
): Promise<void> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/webhooks/${webhookId}.json`;

    await axios.delete(url, {
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
      },
    });
  } catch (error) {
    console.error("[Shopify] Error deleting webhook:", error);
    throw error;
  }
}

// List all webhooks
export async function listWebhooks(config: ShopifyConfig): Promise<any[]> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/webhooks.json`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
      },
    });

    return response.data.webhooks || [];
  } catch (error) {
    console.error("[Shopify] Error listing webhooks:", error);
    throw error;
  }
}

// Fetch customer by phone
export async function getCustomerByPhone(
  config: ShopifyConfig,
  phone: string
): Promise<any> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/customers/search.json`;

    const response = await axios.get(url, {
      params: {
        query: `phone:"${phone}"`,
      },
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
      },
    });

    return response.data.customers?.[0];
  } catch (error) {
    console.error("[Shopify] Error fetching customer:", error);
    throw error;
  }
}

// Fetch completed orders to verify recovery
export async function getOrdersByCustomer(
  config: ShopifyConfig,
  customerId: string
): Promise<any[]> {
  try {
    const url = `${getShopifyUrl(config.shopName, config.apiVersion)}/customers/${customerId}/orders.json`;

    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
      },
    });

    return response.data.orders || [];
  } catch (error) {
    console.error("[Shopify] Error fetching orders:", error);
    throw error;
  }
}

// Extract phone from checkout (handles different formats)
export function extractPhoneFromCheckout(checkout: any): string | null {
  // Try different phone fields
  const phone =
    checkout.phone ||
    checkout.billing_address?.phone ||
    checkout.shipping_address?.phone ||
    checkout.email?.phone;

  if (phone) {
    // Clean phone number: remove spaces, dashes, parentheses
    return phone
      .replace(/[\s\-()]/g, "")
      .replace(/^\+1/, ""); // Remove country code if present
  }

  return null;
}

// Extract customer email
export function extractEmailFromCheckout(checkout: any): string | null {
  return checkout.email || checkout.customer?.email || null;
}

// Extract customer name
export function extractNameFromCheckout(checkout: any): string | null {
  const firstName =
    checkout.billing_address?.first_name ||
    checkout.shipping_address?.first_name ||
    checkout.customer?.first_name ||
    "";
  const lastName =
    checkout.billing_address?.last_name ||
    checkout.shipping_address?.last_name ||
    checkout.customer?.last_name ||
    "";

  return (firstName + " " + lastName).trim() || null;
}

// Extract cart items
export function extractCartItems(checkout: any): string[] {
  return (
    checkout.line_items?.map(
      (item: any) =>
        `${item.title}${item.variant_title ? " (" + item.variant_title + ")" : ""} x${item.quantity}`
    ) || []
  );
}

// Calculate total
export function getCheckoutTotal(checkout: any): number {
  return parseFloat(checkout.total_price || 0);
}

// Check if checkout is abandoned (no completed order)
export function isCheckoutAbandoned(checkout: any): boolean {
  // Abandoned if:
  // 1. Status is "requires_shipping" or "awaiting_payment" (not completed)
  // 2. Has line items
  // 3. Not an order yet

  const hasItems = checkout.line_items && checkout.line_items.length > 0;
  const isCompleted = checkout.order_id != null;

  return hasItems && !isCompleted;
}

// Get recovery message template
export function getRecoveryMessageTemplate(
  customerName: string,
  cartTotal: number,
  discountCode: string = "SAVE10",
  storeUrl?: string
): string {
  const name = customerName.split(" ")[0]; // First name only
  const discount = discountCode || "SAVE10";

  return `Hi ${name}! 👋

You left some items in your cart and we'd love to help you complete your purchase.

💳 Cart Total: $${cartTotal.toFixed(2)}
🎟️ Use code *${discount}* for 10% off

${storeUrl ? `🛍️ Resume checkout: ${storeUrl}` : ""}

Questions? Reply to this message!`;
}
