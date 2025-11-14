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
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/", verifyJWT, createReturnRequest);

router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateReturns);

router.get("/order/:orderId", verifyJWT, getReturnsByOrderId);

router.get("/analytics/summary", verifyJWT, authorizeRoles("seller"), getReturnAnalytics);

router.get("/analytics/monthly", verifyJWT, authorizeRoles("seller"), getMonthlyReturnReport);

router.get("/filter", verifyJWT, authorizeRoles("seller"), filterReturns);

router.put("/bulk/update", verifyJWT, authorizeRoles("seller"), bulkUpdateReturnStatus);

router.get("/", verifyJWT, getAllReturns);

router.get("/:id", verifyJWT, getReturnById);

router.put("/:id/status", verifyJWT, authorizeRoles("seller"), updateReturnStatus);

router.delete("/:id", verifyJWT, authorizeRoles("seller"), deleteReturnRequest);

export default router;
