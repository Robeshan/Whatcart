import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import packageRoutes from "./server/routes/packages.js";
import authRoutes from "./server/routes/auth.js";
import apiKeyRoutes from "./server/routes/apiKeys.js";
import subscriptionRoutes from "./server/routes/subscriptions.js";
import whatsappRoutes from "./server/routes/whatsapp.js";
import shopifyRoutes from "./server/routes/shopify.js";
import adminRoutes from "./server/routes/admin.js";
import { apiRateLimiter } from "./server/utils/middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON with larger body size for WhatsApp webhooks
  app.use(express.json({ limit: "10mb" }));

  // Global rate limiting (skip for webhooks)
  app.use((req, res, next) => {
    if (req.path.includes("/webhook")) {
      return next();
    }
    apiRateLimiter(req, res, next);
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/packages", packageRoutes);
  app.use("/api/api-keys", apiKeyRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  app.use("/api/shopify", shopifyRoutes);
  app.use("/api/admin", adminRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WhatsApp webhook endpoint: ${process.env.APP_URL}/api/whatsapp/webhook`);
    console.log(`Shopify webhook endpoint: ${process.env.APP_URL}/api/shopify/webhook`);
  });
}

startServer();
