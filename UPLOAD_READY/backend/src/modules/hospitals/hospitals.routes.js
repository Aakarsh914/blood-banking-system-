import { Router } from "express";
import { query } from "../../config/db.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT id, name, city FROM hospitals ORDER BY name ASC");
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
