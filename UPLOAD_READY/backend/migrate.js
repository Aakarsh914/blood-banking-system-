import { query } from "./src/config/db.js";

async function run() {
  try {
    await query("ALTER TABLE users ADD COLUMN aadhar_number TEXT;").catch(e => console.log('aadhar_number already exists?'));
    await query("ALTER TABLE users ADD COLUMN latitude REAL;").catch(e => console.log('latitude already exists?'));
    await query("ALTER TABLE users ADD COLUMN longitude REAL;").catch(e => console.log('longitude already exists?'));
    console.log("Migration complete");
  } catch (err) {
    console.error(err);
  }
}
run();
