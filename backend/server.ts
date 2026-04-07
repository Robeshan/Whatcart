import "dotenv/config";
import express from "express";
import packageRoutes from "./server/routes/packages.js";
import authRoutes from "./server/routes/auth.js";
import connectionRoutes from "./server/routes/connections.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS - allow frontend to call API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// API Routes
app.use("/api/packages", packageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/connections", connectionRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
