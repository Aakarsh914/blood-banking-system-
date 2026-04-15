CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'DONOR' CHECK (role IN ('DONOR', 'HOSPITAL', 'ADMIN')),
  hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
  blood_group VARCHAR(10),
  aadhar_number VARCHAR(50),
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_group VARCHAR(10) NOT NULL,
  component VARCHAR(50) NOT NULL,
  units INTEGER NOT NULL CHECK (units >= 0),
  expires_on DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_group VARCHAR(10) NOT NULL,
  units INTEGER NOT NULL CHECK (units > 0),
  urgency VARCHAR(50) DEFAULT 'NORMAL',
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  blood_group VARCHAR(10) NOT NULL,
  component VARCHAR(50) NOT NULL,
  units INTEGER NOT NULL,
  bank_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW blood_inventory_view AS
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
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
  donation_type VARCHAR(20) NOT NULL CHECK (donation_type IN ('AT_HOSPITAL', 'AT_HOME')),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
  scheduled_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
