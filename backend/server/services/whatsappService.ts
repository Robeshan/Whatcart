import axios from "axios";

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "YOUR_PHONE_ID";
const WHATSAPP_API_URL = `https://graph.instagram.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

export interface WhatsAppMessage {
  to: string; // phone number in format: 1234567890
  body?: string;
  type?: "text" | "template";
  template_name?: string;
  template_language?: string;
  template_parameters?: string[];
}

export interface WhatsAppResponse {
  messages: Array<{
    id: string;
    message_status: string;
  }>;
}

// Send WhatsApp Message
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!WHATSAPP_API_TOKEN) {
      throw new Error("WhatsApp API token not configured");
    }

    // Format: country code + number (e.g., +1234567890)
    const formattedTo = message.to.startsWith("+") ? message.to.replace("+", "") : message.to;

    let payload: any = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: message.type || "text",
    };

    if (message.type === "template" && message.template_name) {
      // Template message
      payload.template = {
        name: message.template_name,
        language: {
          code: message.template_language || "en_US",
        },
      };

      if (message.template_parameters && message.template_parameters.length > 0) {
        payload.template.components = [
          {
            type: "body",
            parameters: message.template_parameters.map((param) => ({
              type: "text",
              text: param,
            })),
          },
        ];
      }
    } else {
      // Text message
      payload.text = {
        body: message.body,
      };
    }

    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[WhatsApp] Message sent successfully:", response.data);

    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error("[WhatsApp] Error sending message:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

// Mark Message as Read
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  try {
    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
      throw new Error("WhatsApp configuration missing");
    }

    await axios.post(
      `https://graph.instagram.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error) {
    console.error("[WhatsApp] Error marking message as read:", error);
    return false;
  }
}

// Send Recovery Message (Template-based)
export async function sendRecoveryMessage(
  phoneNumber: string,
  customerName: string,
  cartTotal: number,
  discountCode: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendWhatsAppMessage({
    to: phoneNumber,
    type: "template",
    template_name: "cart_recovery",
    template_language: "en_US",
    template_parameters: [customerName, `$${cartTotal}`, discountCode],
  });
}

// Send Simple Text Message
export async function sendSimpleMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendWhatsAppMessage({
    to: phoneNumber,
    body: message,
    type: "text",
  });
}

// Verify Webhook Token (for Meta callback verification)
export function verifyWebhookToken(token: string): boolean {
  const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || "whatcart_webhook_token_secret";
  return token === WEBHOOK_VERIFY_TOKEN;
}
