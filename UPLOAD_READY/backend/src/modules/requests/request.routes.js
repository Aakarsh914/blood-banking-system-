import { Router } from "express";
import { query } from "../../config/db.js";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";
import { broadcastSOS } from "../../utils/sse.js";
import { sendSosEmail } from "../../services/mailer.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    let sql = "SELECT id, hospital_id, blood_group, units, urgency, status, created_at FROM blood_requests";
    const params = [];
    if (req.user.role === "HOSPITAL") {
      sql += " WHERE hospital_id = $1";
      params.push(req.user.hospitalId);
    }
    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/", requireRole(["ADMIN", "HOSPITAL"]), async (req, res, next) => {
  try {
    let { hospitalId, bloodGroup, units, urgency = "NORMAL" } = req.body;

    if (req.user.role === "HOSPITAL") {
      hospitalId = req.user.hospitalId;
    }

    if (!hospitalId || !bloodGroup || !units) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const insert = await query(
      `INSERT INTO blood_requests (hospital_id, blood_group, units, urgency, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [hospitalId, bloodGroup, units, urgency]
    );
    const created = await query(`
      SELECT br.*, h.name as hospital_name 
      FROM blood_requests br
      LEFT JOIN hospitals h ON h.id = br.hospital_id 
      WHERE br.id = $1
    `, [insert.lastInsertRowid]);
    
    const record = created.rows[0];

    // Real-Time Notification Broadcast
    if (urgency === "CRITICAL") {
      broadcastSOS({
        type: 'SOS_ALERT',
        requestId: record.id,
        requesterId: record.hospital_id,
        hospitalName: record.hospital_name || `Hospital #${hospitalId}`,
        bloodGroup: record.blood_group,
        units: record.units,
        timestamp: new Date().toISOString()
      });

      // Durable Offline Email Dispatch (runs asynchronously in background)
      query("SELECT email FROM users WHERE role IN ('ADMIN', 'HOSPITAL') AND (hospital_id != $1 OR hospital_id IS NULL)", [hospitalId])
        .then(adminRes => {
           const emails = adminRes.rows.map(row => row.email).filter(Boolean);
           if (emails.length > 0) {
             sendSosEmail(emails, {
               hospitalName: record.hospital_name || `Hospital #${hospitalId}`,
               bloodGroup: record.blood_group,
               units: record.units
             }).catch(err => console.error("SOS Email Dispatch Exception", err));
           }
        })
        .catch(err => console.error("Database Lookup for SOS Email Failed", err));
    }

    return res.status(201).json(record);
  } catch (err) {
    return next(err);
  }
});

router.post("/:id/respond", requireRole(["ADMIN", "HOSPITAL"]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestRes = await query("SELECT * FROM blood_requests WHERE id = $1", [id]);
    if (requestRes.rows.length === 0) return res.status(404).json({ error: "Request not found" });
    
    const bloodRequest = requestRes.rows[0];
    let responderName = "A network hospital";
    if (req.user.hospitalId) {
      const respName = await query("SELECT name FROM hospitals WHERE id = $1", [req.user.hospitalId]);
      if (respName.rows.length > 0) responderName = respName.rows[0].name;
    }

    // Broadcast the Help Intent back down to the target hospital
    broadcastSOS({
      type: 'SOS_RESPONSE',
      targetId: bloodRequest.hospital_id,
      responderName,
      bloodGroup: bloodRequest.blood_group,
      units: bloodRequest.units,
      timestamp: new Date().toISOString()
    });

    return res.json({ message: "Response broadcasted" });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/status", requireRole(["ADMIN", "HOSPITAL"]), async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const requestRes = await query("SELECT * FROM blood_requests WHERE id = $1", [id]);
    if (requestRes.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    const bloodRequest = requestRes.rows[0];

    if (status === "FULFILLED" && bloodRequest.status !== "FULFILLED") {
      const invCheck = await query(
        "SELECT id, units FROM blood_inventory WHERE bank_id = $1 AND blood_group = $2 AND units >= $3 LIMIT 1",
        [bloodRequest.hospital_id, bloodRequest.blood_group, bloodRequest.units]
      );
      if (invCheck.rows.length === 0) {
        return res.status(400).json({ error: "Insufficient inventory to fulfill this request" });
      }
      
      const invId = invCheck.rows[0].id;
      await query(
        "UPDATE blood_inventory SET units = units - $1 WHERE id = $2",
        [bloodRequest.units, invId]
      );

      await query(
        `INSERT INTO inventory_history (user_id, action, blood_group, component, units, bank_id)
         VALUES ($1, 'FULFILL', $2, 'ANY', $3, $4)`,
        [req.user.id, bloodRequest.blood_group, -bloodRequest.units, bloodRequest.hospital_id]
      );
    }

    await query("UPDATE blood_requests SET status = $1 WHERE id = $2", [status, id]);
    const updated = await query("SELECT * FROM blood_requests WHERE id = $1", [id]);
    return res.json(updated.rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
