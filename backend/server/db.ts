import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile_number VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        otp VARCHAR(10),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        features TEXT,
        popular BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        shopify_url VARCHAR(255),
        shopify_token VARCHAR(255),
        whatsapp_status VARCHAR(50) DEFAULT 'disconnected',
        whatsapp_phone VARCHAR(50),
        is_active BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed initial data if empty
    const result = await db.query("SELECT COUNT(*) as count FROM packages");
    if (parseInt(result.rows[0].count) === 0) {
      const insert = "INSERT INTO packages (name, price, description, features, popular) VALUES ($1, $2, $3, $4, $5)";
      await db.query(insert, ["Starter", 29, "Perfect for small stores starting with recovery.", JSON.stringify(['Up to 500 recoveries/mo', 'Standard Templates', 'Email Support', 'Basic Analytics']), false]);
      await db.query(insert, ["Growth", 79, "For growing brands needing more power.", JSON.stringify(['Unlimited recoveries', 'Custom Templates', 'Priority Support', 'Advanced Analytics', 'Shopify Integration']), true]);
      await db.query(insert, ["Enterprise", 249, "Advanced features for high-volume stores.", JSON.stringify(['Dedicated Account Manager', 'Custom Webhooks', 'API Access', 'White-labeling', 'Multi-store support']), false]);
    }
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

initDb();

export default db;
