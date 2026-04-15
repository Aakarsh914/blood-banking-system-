const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/bloodbank.db');

db.serialize(() => {
  db.each("SELECT * FROM users", (err, row) => {
    if (err) console.error(err);
    console.log(row.email, row.password_hash);
  });
});
db.close();
