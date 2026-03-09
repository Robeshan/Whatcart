import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const packages = db.prepare("SELECT * FROM packages").all();
  res.json(packages.map((p: any) => ({ ...p, features: JSON.parse(p.features) })));
});

router.post("/", (req, res) => {
  const { name, price, description, features, popular } = req.body;
  const insert = db.prepare("INSERT INTO packages (name, price, description, features, popular) VALUES (?, ?, ?, ?, ?)");
  const result = insert.run(name, price, description, JSON.stringify(features), popular ? 1 : 0);
  res.json({ id: result.lastInsertRowid });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, description, features, popular, active } = req.body;
  const update = db.prepare("UPDATE packages SET name = ?, price = ?, description = ?, features = ?, popular = ?, active = ? WHERE id = ?");
  update.run(name, price, description, JSON.stringify(features), popular ? 1 : 0, active ? 1 : 0, id);
  res.json({ success: true });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM packages WHERE id = ?").run(id);
  res.json({ success: true });
});

export default router;
