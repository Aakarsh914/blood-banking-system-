import fs from "fs/promises";
import dotenv from "dotenv";
import fsSync from "fs";
import path from "path";
import pg from "pg";
import initSqlJs from "sql.js";

dotenv.config();

const { Pool } = pg;

async function runSqlFile(pool, filePath) {
  const sql = await fs.readFile(filePath, "utf8");
  await pool.query(sql);
}

async function runSqliteFile(db, filePath) {
  const sql = await fs.readFile(filePath, "utf8");
  db.exec(sql);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in backend/.env");
  }

  if (process.env.DATABASE_URL.startsWith("sqlite:")) {
    const dbPath = process.env.DATABASE_URL.replace("sqlite:", "");
    const absolutePath = path.resolve(dbPath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const SQL = await initSqlJs();
    const existing = fsSync.existsSync(absolutePath) ? fsSync.readFileSync(absolutePath) : null;
    const db = existing ? new SQL.Database(existing) : new SQL.Database();
    await runSqliteFile(db, "sql/schema.sqlite.sql");
    await runSqliteFile(db, "sql/seed.sqlite.sql");
    fsSync.writeFileSync(absolutePath, Buffer.from(db.export()));
    db.close();
    console.log("SQLite schema and seed data applied successfully.");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await runSqlFile(pool, "sql/schema.sql");
    await runSqlFile(pool, "sql/seed.sql");
    console.log("Database schema and seed data applied successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("DB setup failed:", err.message || err);
  if (err.code) {
    console.error("Error code:", err.code);
  }
  process.exit(1);
});
