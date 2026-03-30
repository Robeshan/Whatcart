import Database from "better-sqlite3";

const db = new Database("whatcart.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    verification_code_expiry DATETIME,
    reset_token TEXT,
    reset_token_expiry DATETIME,
    subscription_plan_id INTEGER DEFAULT 1,
    billing_status TEXT DEFAULT 'active',
    trial_ends_at DATETIME,
    is_admin INTEGER DEFAULT 0,
    onboarding_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_plan_id) REFERENCES packages(id)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT UNIQUE NOT NULL,
    name TEXT,
    last_used_at DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    features TEXT,
    popular INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    message_limit_monthly INTEGER,
    recovery_limit_monthly INTEGER,
    max_templates INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    messages_sent INTEGER DEFAULT 0,
    recoveries_triggered INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT NOT NULL,
    target_user_id INTEGER,
    target_resource TEXT,
    details TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS message_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    greeting TEXT,
    discount_code TEXT,
    urgency_text TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shopify_stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shop_name TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    api_version TEXT DEFAULT 'v2024-01',
    scopes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS abandoned_carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shopify_store_id INTEGER NOT NULL,
    shopify_checkout_id TEXT UNIQUE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    cart_items TEXT,
    cart_total REAL,
    cart_currency TEXT DEFAULT 'USD',
    checkout_url TEXT,
    recovery_message_sent INTEGER DEFAULT 0,
    message_id TEXT,
    status TEXT DEFAULT 'abandoned',
    recovered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shopify_store_id) REFERENCES shopify_stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shopify_webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shopify_store_id INTEGER NOT NULL,
    webhook_id TEXT UNIQUE,
    topic TEXT,
    address TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shopify_store_id) REFERENCES shopify_stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    whatsapp_message_id TEXT,
    phone_number TEXT NOT NULL,
    customer_name TEXT,
    message_body TEXT,
    cart_total REAL,
    discount_code TEXT,
    status TEXT DEFAULT 'pending',
    direction TEXT DEFAULT 'outbound',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
  CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
  CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_message_logs_whatsapp_id ON message_logs(whatsapp_message_id);
  CREATE INDEX IF NOT EXISTS idx_message_logs_phone ON message_logs(phone_number);
  CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_shopify_stores_user_id ON shopify_stores(user_id);
  CREATE INDEX IF NOT EXISTS idx_shopify_stores_shop_name ON shopify_stores(shop_name);
  CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON abandoned_carts(user_id);
  CREATE INDEX IF NOT EXISTS idx_abandoned_carts_shopify_id ON abandoned_carts(shopify_checkout_id);
  CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
  CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at ON abandoned_carts(created_at);
  CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_store_id ON shopify_webhooks(shopify_store_id);
`);

// Seed initial data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM packages").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO packages (name, price, description, features, popular, message_limit_monthly, recovery_limit_monthly, max_templates) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insert.run(
    "Starter",
    29,
    "Perfect for small stores starting with recovery.",
    JSON.stringify(['Up to 5,000 messages/mo', 'Up to 500 recoveries/mo', 'Up to 5 templates', 'Standard Templates', 'Email Support', 'Basic Analytics']),
    0,
    5000,
    500,
    5
  );
  insert.run(
    "Growth",
    79,
    "For growing brands needing more power.",
    JSON.stringify(['Up to 50,000 messages/mo', 'Unlimited recoveries', 'Up to 25 templates', 'Custom Templates', 'Priority Support', 'Advanced Analytics', 'Shopify Integration']),
    1,
    50000,
    null, // unlimited
    25
  );
  insert.run(
    "Enterprise",
    249,
    "Advanced features for high-volume stores.",
    JSON.stringify(['Unlimited messages', 'Unlimited recoveries', 'Unlimited templates', 'Dedicated Account Manager', 'Custom Webhooks', 'API Access', 'White-labeling', 'Multi-store support']),
    0,
    null, // unlimited
    null, // unlimited
    null // unlimited
  );
}

export default db;
