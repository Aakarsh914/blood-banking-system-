import fs from "fs";
import path from "path";
import pg from "pg";
import initSqlJs from "sql.js";
import { env } from "./env.js";

const { Pool } = pg;
export const isSqlite = env.databaseUrl.startsWith("sqlite:");

let sqliteDbPromise = null;
let pgPool = null;

if (isSqlite) {
  sqliteDbPromise = initSqliteDb();
} else {
  const isSupabase = env.databaseUrl.includes("supabase.co");
  pgPool = new Pool({
    connectionString: env.databaseUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : false
  });
}

async function initSqliteDb() {
  const SQL = await initSqlJs();
  const filePath = env.databaseUrl.replace("sqlite:", "");
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(absolutePath)) {
    const fileBuffer = fs.readFileSync(absolutePath);
    return { db: new SQL.Database(fileBuffer), absolutePath };
  }
  return { db: new SQL.Database(), absolutePath };
}

function toSqlitePlaceholders(sql) {
  return sql.replace(/\$\d+/g, "?");
}

function persistSqlite(db, absolutePath) {
  const data = db.export();
  fs.writeFileSync(absolutePath, Buffer.from(data));
}

export async function query(sql, params = []) {
  if (!isSqlite) {
    return pgPool.query(sql, params);
  }

  const { db, absolutePath } = await sqliteDbPromise;
  const sqliteSql = toSqlitePlaceholders(sql);
  const normalized = sql.trim().toUpperCase();

  if (normalized.startsWith("SELECT")) {
    const statement = db.prepare(sqliteSql);
    statement.bind(params);
    const rows = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    statement.free();
    return { rows, rowCount: rows.length };
  }

  const before = db.exec("SELECT last_insert_rowid() AS id");
  db.run(sqliteSql, params);
  const after = db.exec("SELECT changes() AS changes, last_insert_rowid() AS id");
  persistSqlite(db, absolutePath);
  const changes = after[0]?.values?.[0]?.[0] || 0;
  const lastId = after[0]?.values?.[0]?.[1] || before[0]?.values?.[0]?.[0] || null;
  return { rows: [], rowCount: changes, lastInsertRowid: lastId };
}
