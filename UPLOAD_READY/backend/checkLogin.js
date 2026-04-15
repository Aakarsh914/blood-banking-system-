import { query } from "./src/config/db.js";

async function run() {
  const users = await query("SELECT email, password_hash FROM users");
  console.log(users.rows);
}
run();
