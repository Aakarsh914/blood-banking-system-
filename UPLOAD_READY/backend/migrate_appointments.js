import { query } from "./src/config/db.js";

async function run() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS donation_appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        hospital_id INTEGER,
        donation_type TEXT NOT NULL CHECK (donation_type IN ('AT_HOSPITAL', 'AT_HOME')),
        status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
        scheduled_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
      );
    `);
    console.log("Migration complete: donation_appointments table created.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
run();
