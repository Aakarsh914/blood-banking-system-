CREATE TABLE IF NOT EXISTS otp_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'DONOR' CHECK (role IN ('DONOR', 'HOSPITAL', 'ADMIN')),
  hospital_id INTEGER,
  blood_group TEXT,
  aadhar_number TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL,
  blood_group TEXT NOT NULL,
  component TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units >= 0),
  expires_on TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id INTEGER NOT NULL,
  blood_group TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units > 0),
  urgency TEXT DEFAULT 'NORMAL',
  status TEXT DEFAULT 'PENDING',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  component TEXT NOT NULL,
  units INTEGER NOT NULL,
  bank_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (bank_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE VIEW IF NOT EXISTS blood_inventory_view AS
SELECT
  bi.id,
  bi.bank_id,
  h.name AS bank_name,
  bi.blood_group,
  bi.component,
  bi.units,
  bi.expires_on
FROM blood_inventory bi
JOIN hospitals h ON h.id = bi.bank_id;

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
