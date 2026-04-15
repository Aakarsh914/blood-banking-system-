import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";
import { env } from "../../config/env.js";
import { sendOtpEmail } from "../../services/mailer.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { isValidAadhar } from "../../utils/aadharValidator.js";

const JWT_SECRET = env.jwtSecret || "fallback_super_secret_jwt_key_for_dev";
const router = Router();

router.post("/request-otp", async (req, res, next) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    email = email.toLowerCase();

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // 10 mins expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Upsert into otp_verifications
    const existingOtp = await query("SELECT id FROM otp_verifications WHERE email = $1", [email]);
    if (existingOtp.rows.length > 0) {
      await query("UPDATE otp_verifications SET otp = $1, expires_at = $2 WHERE email = $3", [otp, expiresAt, email]);
    } else {
      await query("INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3)", [email, otp, expiresAt]);
    }

    // Send email via our mailer service
    const { previewUrl } = await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent successfully", previewUrl });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    let { name, email, password, role = "DONOR", bloodGroup, hospitalId, otp } = req.body;
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ error: "name, email, password, and otp are required" });
    }
    email = email.toLowerCase();

    if (role === "ADMIN" && email !== "sahniaakarsh6@gmail.com") {
      return res.status(403).json({ error: "You cannot register as ADMIN. Access restricted." });
    }
    
    // Check OTP
    const otpRecord = await query("SELECT * FROM otp_verifications WHERE email = $1", [email]);
    if (otpRecord.rows.length === 0) {
      return res.status(400).json({ error: "No OTP requested for this email" });
    }

    if (otpRecord.rows[0].otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date(otpRecord.rows[0].expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Check if user exists (again, for safety)
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertResult = await query(
      `INSERT INTO users (email, password_hash, name, role, hospital_id, blood_group)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, passwordHash, name, role, hospitalId || null, bloodGroup || null]
    );

    // Delete OTP after successful registration
    await query("DELETE FROM otp_verifications WHERE email = $1", [email]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    email = email.toLowerCase();

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.role === "ADMIN" && user.email !== "sahniaakarsh6@gmail.com") {
      return res.status(403).json({ error: "Unauthorized. Admin login strictly restricted." });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospital_id,
      bloodGroup: user.blood_group,
      aadharNumber: user.aadhar_number,
      latitude: user.latitude,
      longitude: user.longitude
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      user: tokenPayload
    });
  } catch (err) {
    next(err);
  }
});

router.post("/request-aadhar-otp", authenticate, async (req, res, next) => {
  try {
    const { aadharNumber } = req.body;
    if (!aadharNumber) return res.status(400).json({ error: "Aadhar Number is required" });

    // Explicit Cryptographic Verhoeff Form Validation for Indian Aadhar numbers
    if (!isValidAadhar(aadharNumber)) {
      return res.status(400).json({ error: "Invalid Aadhar Card Number. Please ensure it is a valid 12-digit Indian Aadhar ID." });
    }

    // Check if Aadhaar is already linked to another account
    const existing = await query("SELECT id FROM users WHERE aadhar_number = $1 AND id != $2", [aadharNumber, req.user.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "This Aadhar Number is already linked to another account." });
    }

    // Sandbox API call simulation
    // In production, this hits an API (like Setu/Surepass) and returns a reference_id.
    // For now we just return success. The expected sandbox OTP is '123456'.
    res.json({ message: "OTP sent successfully to registered mobile number (Sandbox)", sandboxOtp: "123456" });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-aadhar-otp", authenticate, async (req, res, next) => {
  try {
    const { aadharNumber, otp } = req.body;
    if (!aadharNumber || !otp) return res.status(400).json({ error: "Aadhar and OTP are required" });

    if (otp !== "123456") {
      return res.status(400).json({ error: "Invalid Aadhar OTP. (Hint: Use Sandbox OTP 123456)" });
    }

    // Update Aadhar if successful
    await query("UPDATE users SET aadhar_number = $1 WHERE id = $2", [aadharNumber, req.user.id]);

    const updated = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = updated.rows[0];

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospital_id,
      bloodGroup: user.blood_group,
      aadharNumber: user.aadhar_number,
      latitude: user.latitude,
      longitude: user.longitude
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

    res.json({ message: "Aadhar Verified and Linked Successfully", token, user: tokenPayload });
  } catch (err) {
    next(err);
  }
});

router.patch("/profile", authenticate, async (req, res, next) => {
  try {
    const { bloodGroup, latitude, longitude } = req.body;
    if (!bloodGroup || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required profile fields" });
    }
    
    // We assume aadhar is already verified and set through /verify-aadhar-otp
    const userRow = await query("SELECT aadhar_number FROM users WHERE id = $1", [req.user.id]);
    if (!userRow.rows[0].aadhar_number) {
      return res.status(400).json({ error: "Aadhar authentication is incomplete. Please verify your Aadhar first." });
    }
    
    await query(
      "UPDATE users SET blood_group = $1, latitude = $2, longitude = $3 WHERE id = $4",
      [bloodGroup, parseFloat(latitude), parseFloat(longitude), req.user.id]
    );
    
    const updated = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = updated.rows[0];
    
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospital_id,
      bloodGroup: user.blood_group,
      aadharNumber: user.aadhar_number,
      latitude: user.latitude,
      longitude: user.longitude
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });
    
    res.json({ message: "Profile updated successfully", token, user: tokenPayload });
  } catch (err) {
    next(err);
  }
});

export default router;
