const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/bloodbank.db');

db.serialize(() => {
  db.run("UPDATE users SET email='admin_gmc@test.com', name='GMC Hospital Admin', hospital_id=1 WHERE email='hospital@test.com'");
  
  const stmt = db.prepare("INSERT INTO users (email, password_hash, name, role, hospital_id, blood_group) VALUES (?, ?, ?, ?, ?, ?)");
  const hash = '$2b$10$9zC1UGdn8FFRpoJ1Tfavv./gzwbxz.jVcCfMg6V6dllSaWTjXmPZm';
  
  stmt.run('admin_smgs@test.com', hash, 'SMGS Hospital Admin', 'HOSPITAL', 2, null, (err) => {
    if (err && !err.message.includes('UNIQUE')) console.log(err);
  });
  stmt.run('admin_narayana@test.com', hash, 'Narayana Hospital Admin', 'HOSPITAL', 3, null, (err) => {
    if (err && !err.message.includes('UNIQUE')) console.log(err);
  });
  
  stmt.finalize();
  console.log("Admins successfully injected into the database.");
});

db.close();
