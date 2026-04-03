import Database from "better-sqlite3";

const db = new Database("whatcart.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    reset_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    features TEXT, -- JSON string
    popular INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shopify_url TEXT,
    shopify_token TEXT,
    whatsapp_status TEXT DEFAULT 'disconnected',
    whatsapp_phone TEXT,
    is_active INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM packages").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO packages (name, price, description, features, popular) VALUES (?, ?, ?, ?, ?)");
  insert.run("Starter", 29, "Perfect for small stores starting with recovery.", JSON.stringify(['Up to 500 recoveries/mo', 'Standard Templates', 'Email Support', 'Basic Analytics']), 0);
  insert.run("Growth", 79, "For growing brands needing more power.", JSON.stringify(['Unlimited recoveries', 'Custom Templates', 'Priority Support', 'Advanced Analytics', 'Shopify Integration']), 1);
  insert.run("Enterprise", 249, "Advanced features for high-volume stores.", JSON.stringify(['Dedicated Account Manager', 'Custom Webhooks', 'API Access', 'White-labeling', 'Multi-store support']), 0);
}

export default db;
