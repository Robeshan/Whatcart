import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack)
  }
  console.log('Connected to PostgreSQL database!')
  if (client) {
    client.release()
  }
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

const initializeDatabase = async () => {
  // Create packages table first if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT,
      features TEXT,
      popular INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      message_limit_monthly INTEGER,
      recovery_limit_monthly INTEGER,
      max_templates INTEGER,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if the default package exists
  const starterPackage = await db.query("SELECT * FROM packages WHERE id = 1");
  if (starterPackage.rows.length === 0) {
    // Insert the default "Starter" package
    await db.query(`
      INSERT INTO packages (id, name, price, description, features, message_limit_monthly, recovery_limit_monthly, max_templates)
      VALUES (1, 'Starter', 0, 'Basic plan for getting started.', '["Feature 1", "Feature 2"]', 100, 10, 3)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Default "Starter" package created.');
  }

  // Create users table if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      phone TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      verification_code_expiry TIMESTAMPTZ,
      reset_token TEXT,
      reset_token_expiry TIMESTAMPTZ,
      subscription_plan_id INTEGER DEFAULT 1,
      billing_status TEXT DEFAULT 'active',
      trial_ends_at TIMESTAMPTZ,
      is_admin INTEGER DEFAULT 0,
      onboarding_completed INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_plan_id) REFERENCES packages(id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      key TEXT UNIQUE NOT NULL,
      name TEXT,
      last_used_at TIMESTAMPTZ,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      api_endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      messages_sent INTEGER DEFAULT 0,
      recoveries_triggered INTEGER DEFAULT 0,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      target_resource TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      greeting TEXT,
      discount_code TEXT,
      urgency_text TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS shopify_stores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      shop_name TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      api_version TEXT DEFAULT 'v2024-01',
      scopes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
};

initializeDatabase().catch(console.error);

export default db;
