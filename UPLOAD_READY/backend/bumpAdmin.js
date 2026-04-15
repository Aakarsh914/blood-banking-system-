import { query } from "./src/config/db.js";

async function run() {
  await query("UPDATE users SET role = 'ADMIN' WHERE email = 'sahniaakarsh6@gmail.com'");
  console.log("Upgraded");
}
run();
