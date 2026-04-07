import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const pkgs = await db.query("SELECT * FROM packages");
    res.json(pkgs.rows.map((p: any) => ({ ...p, features: JSON.parse(p.features) })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

router.post("/", async (req, res) => {
  const { name, price, description, features, popular } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO packages (name, price, description, features, popular) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, price, description, JSON.stringify(features), !!popular]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create package" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, description, features, popular, active } = req.body;
  try {
    await db.query(
      "UPDATE packages SET name = $1, price = $2, description = $3, features = $4, popular = $5, active = $6 WHERE id = $7",
      [name, price, description, JSON.stringify(features), !!popular, !!active, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update package" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM packages WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete package" });
  }
});

export default router;
