import bcrypt from "bcryptjs";
import { query } from "./src/config/db.js";

async function run() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Aakarsh@123", salt);
    await query("UPDATE users SET password_hash = $1 WHERE email = 'sahniaakarsh6@gmail.com'", [hash]);
    console.log("Password updated successfully.");
  } catch (err) {
    console.error("Error updating password:", err);
  }
}

run();
