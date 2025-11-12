import express from "express";
import {
  createLog,
  getLogs,
  getLogById,
  getLogsByUser,
  getLogsByAction,
  deleteLog,
  getLogsByDateRange,
  getLogsByEntity,
  getMostActiveUsers,
  getActionStats,
  clearAllLogs,
  getLogsByIp
} from "../controllers/log.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/", createLog);

// Protected Routes - only logged-in users
router.get("/", verifyJWT, getLogs);
router.get("/id/:logId", verifyJWT, getLogById);
router.get("/user/:userId", verifyJWT, getLogsByUser);
router.get("/action/:action", verifyJWT, getLogsByAction);
router.get("/entity/:entityId", verifyJWT, getLogsByEntity);
router.get("/date-range", verifyJWT, getLogsByDateRange);
router.get("/ip/:ip", verifyJWT, getLogsByIp);

// Admin Routes - restricted to admin role
router.delete("/id/:logId", verifyJWT, authorizeRoles("admin"), deleteLog);
router.delete("/clear-all", verifyJWT, authorizeRoles("admin"), clearAllLogs);
router.get("/stats/actions", verifyJWT, authorizeRoles("admin"), getActionStats);
router.get("/stats/most-active-users", verifyJWT, authorizeRoles("admin"), getMostActiveUsers);

export default router;
