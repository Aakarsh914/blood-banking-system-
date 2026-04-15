import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_SECRET = env.jwtSecret || "fallback_super_secret_jwt_key_for_dev";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, hospital_id, etc. }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Token verification failed" });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: You do not have the required role" });
    }
    next();
  };
}
