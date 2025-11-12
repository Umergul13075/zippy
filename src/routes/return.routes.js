import express from "express";
import {
  createReturnRequest,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturnRequest,
  getReturnsByOrderId,
  getReturnAnalytics,
  bulkCreateReturns,
  bulkUpdateReturnStatus,
  filterReturns,
  getMonthlyReturnReport
} from "../controllers/return.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();


router.post("/", verifyJWT, createReturnRequest);

router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateReturns);

router.get("/", verifyJWT, getAllReturns);

router.get("/:id", verifyJWT, getReturnById);

router.put("/:id/status", verifyJWT, authorizeRoles("admin"), updateReturnStatus);

router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteReturnRequest);

router.get("/order/:orderId", verifyJWT, getReturnsByOrderId);

router.get("/analytics/summary", verifyJWT, authorizeRoles("admin"), getReturnAnalytics);

router.put("/bulk/update", verifyJWT, authorizeRoles("admin"), bulkUpdateReturnStatus);

router.get("/filter", verifyJWT, authorizeRoles("admin"), filterReturns);

router.get("/analytics/monthly", verifyJWT, authorizeRoles("admin"), getMonthlyReturnReport);

export default router;
