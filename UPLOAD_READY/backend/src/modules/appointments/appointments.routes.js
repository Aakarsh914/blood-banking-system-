import { Router } from "express";
import { query } from "../../config/db.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { sendAppointmentEmail } from "../../services/mailer.js";
import { broadcastSOS } from "../../utils/sse.js";

const router = Router();
router.use(authenticate);

// List appointments depending on role
router.get("/", async (req, res, next) => {
  try {
    let sql = `
      SELECT 
        a.id, 
        a.donor_id, 
        u.name as donor_name,
        u.blood_group as donor_blood_group,
        a.hospital_id, 
        h.name as hospital_name, 
        a.donation_type, 
        a.status, 
        a.scheduled_date, 
        a.created_at 
      FROM donation_appointments a
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      LEFT JOIN users u ON a.donor_id = u.id
    `;
    let params = [];
    
    if (req.user.role === "DONOR") {
      sql += " WHERE a.donor_id = $1 ORDER BY a.created_at DESC";
      params.push(req.user.id);
    } else if (req.user.role === "HOSPITAL") {
      sql += " WHERE a.hospital_id = $1 ORDER BY a.created_at DESC";
      params.push(req.user.hospitalId);
    } else { // ADMIN
      sql += " ORDER BY a.created_at DESC";
    }

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

// Update appointment status (Admin / Hospital)
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["PENDING", "APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    // Minimal access control: Donor can't patch
    if (req.user.role === "DONOR") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await query("UPDATE donation_appointments SET status = $1 WHERE id = $2", [status, req.params.id]);
    
    return res.json({ message: `Appointment status updated to ${status}` });
  } catch (err) {
    return next(err);
  }
});

// Create a new appointment
router.post("/", async (req, res, next) => {
  try {
    const { hospitalId, donationType, scheduledDate } = req.body;
    if (!donationType || !['AT_HOSPITAL', 'AT_HOME'].includes(donationType)) {
      return res.status(400).json({ error: "Invalid donation type" });
    }
    
    // We can allow hospitalId to be null/undefined strictly if donation_type is AT_HOME and they don't specify,
    // but the system UI ensures they select a hospital to handle the home collection.
    const hId = hospitalId || null;

    const insert = await query(
      `INSERT INTO donation_appointments (donor_id, hospital_id, donation_type, status, scheduled_date)
       VALUES ($1, $2, $3, 'PENDING', $4)`,
      [req.user.id, hId, donationType, scheduledDate || null]
    );
    
    // For SQLite, lastInsertRowid is appended to the response object by our custom db.js
    const createdId = insert.lastInsertRowid || (insert.rows && insert.rows[0]?.id) || null;
    
    let created;
    if (createdId) {
       created = await query("SELECT a.*, h.name as hospital_name FROM donation_appointments a LEFT JOIN hospitals h ON a.hospital_id = h.id WHERE a.id = $1", [createdId]);
    } else {
       // fallback for non-sqlite without returning
       const fallback = await query("SELECT a.*, h.name as hospital_name FROM donation_appointments a LEFT JOIN hospitals h ON a.hospital_id = h.id WHERE a.donor_id = $1 ORDER BY a.created_at DESC LIMIT 1", [req.user.id]);
       created = fallback;
    }
    
    // Async dispatcher for email
    const record = created.rows[0];
    if (record) {
      sendAppointmentEmail(req.user.email, {
         hospitalName: record.hospital_name,
         type: record.donation_type,
         date: record.scheduled_date
      }).catch(err => console.error("Failed to send appointment email:", err));
      
      // Dispatch real-time SSE push to the target hospital
      if (hId) {
        broadcastSOS({
          type: 'NEW_APPOINTMENT',
          targetId: hId,
          donorName: req.user.name,
          bloodGroup: req.user.bloodGroup || "Unknown",
          donationType: donationType === 'AT_HOME' ? 'Home Collection' : 'Hospital Visit',
          scheduledDate: scheduledDate,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return res.status(201).json(record);
  } catch (err) {
    return next(err);
  }
});

export default router;
