import { Router } from "express";
import { query } from "../../config/db.js";
import { authenticate, requireRole } from "../../middlewares/authMiddleware.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    let sql = "SELECT id, blood_group, component, units, expires_on, bank_name, bank_id FROM blood_inventory_view";
    const params = [];
    if (req.user.role === "HOSPITAL") {
      sql += " WHERE bank_id = $1";
      params.push(req.user.hospitalId);
    }
    sql += " ORDER BY blood_group";
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    let sql = `
      SELECT 
        ih.id,
        u.name as user_name,
        u.role as user_role,
        ih.action,
        ih.blood_group,
        ih.component,
        ih.units,
        h.name as bank_name,
        ih.created_at
      FROM inventory_history ih
      LEFT JOIN users u ON u.id = ih.user_id
      LEFT JOIN hospitals h ON h.id = ih.bank_id
    `;
    const params = [];
    if (req.user.role === "HOSPITAL") {
      sql += " WHERE ih.bank_id = $1";
      params.push(req.user.hospitalId);
    }
    sql += " ORDER BY ih.created_at DESC LIMIT 100";
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/", requireRole(["ADMIN", "HOSPITAL"]), async (req, res, next) => {
  try {
    let { bankId, bloodGroup, component, units, expiresOn } = req.body;
    
    if (req.user.role === "HOSPITAL") {
      bankId = req.user.hospitalId;
    }
    
    if (!bankId || !bloodGroup || !component || !units || !expiresOn) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const existing = await query(
      "SELECT id FROM blood_inventory WHERE bank_id = $1 AND blood_group = $2 AND component = $3 LIMIT 1",
      [bankId, bloodGroup, component]
    );
    
    let insertedId;

    if (existing.rows.length > 0) {
      insertedId = existing.rows[0].id;
      await query(
        "UPDATE blood_inventory SET units = units + $1, expires_on = $2 WHERE id = $3",
        [units, expiresOn, insertedId]
      );
    } else {
      const insert = await query(
        `INSERT INTO blood_inventory (bank_id, blood_group, component, units, expires_on)
         VALUES ($1, $2, $3, $4, $5)`,
        [bankId, bloodGroup, component, units, expiresOn]
      );
      insertedId = insert.lastInsertRowid;
    }
    
    await query(
      `INSERT INTO inventory_history (user_id, action, blood_group, component, units, bank_id)
       VALUES ($1, 'ADD', $2, $3, $4, $5)`,
      [req.user.id, bloodGroup, component, units, bankId]
    );

    const created = await query("SELECT * FROM blood_inventory WHERE id = $1", [insertedId]);
    return res.status(201).json(created.rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
