import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import requestRoutes from "../modules/requests/request.routes.js";
import hospitalRoutes from "../modules/hospitals/hospitals.routes.js";
import appointmentRoutes from "../modules/appointments/appointments.routes.js";
import { sseMiddleware } from "../utils/sse.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "blood-bank-api" });
});

router.get("/notifications/stream", sseMiddleware);

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/requests", requestRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/appointments", appointmentRoutes);

export default router;
