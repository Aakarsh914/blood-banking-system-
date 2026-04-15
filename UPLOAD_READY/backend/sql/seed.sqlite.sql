INSERT OR IGNORE INTO hospitals (id, name, city) VALUES
  (1, 'Government Medical College (GMC)', 'Jammu'),
  (2, 'SMGS Hospital', 'Jammu'),
  (3, 'Narayana Superspeciality Hospital', 'Katra');

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, hospital_id, blood_group) VALUES
  (1, 'sahniaakarsh6@gmail.com', '$2b$10$9zC1UGdn8FFRpoJ1Tfavv./gzwbxz.jVcCfMg6V6dllSaWTjXmPZm', 'Admin User', 'ADMIN', NULL, NULL),
  (2, 'admin_gmc@test.com', '$2b$10$SY5ZumI5/a3JOsQ3btQ0HuEQBIq5KKlIE19AkiNs2/bACVJy83lH6', 'GMC Hospital Admin', 'HOSPITAL', 1, NULL),
  (3, 'admin_smgs@test.com', '$2b$10$SY5ZumI5/a3JOsQ3btQ0HuEQBIq5KKlIE19AkiNs2/bACVJy83lH6', 'SMGS Hospital Admin', 'HOSPITAL', 2, NULL),
  (4, 'admin_narayana@test.com', '$2b$10$SY5ZumI5/a3JOsQ3btQ0HuEQBIq5KKlIE19AkiNs2/bACVJy83lH6', 'Narayana Hospital Admin', 'HOSPITAL', 3, NULL),
  (5, 'donor@test.com', '$2b$10$9zC1UGdn8FFRpoJ1Tfavv./gzwbxz.jVcCfMg6V6dllSaWTjXmPZm', 'John Doe', 'DONOR', NULL, 'O+');


