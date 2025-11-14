import express from "express";
import {
  createShipping,
  getAllShippings,
  getShippingById,
  updateShipping,
  softDeleteShipping,
  restoreShipping,
  deleteShipping,
  getShippingAnalytics,
  bulkUpdateShippingStatus,
  getShippingByOrderId
} from "../controllers/shipping.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createShipping);

router.get("/", verifyJWT, getAllShippings); 

router.get("/order/:orderId", verifyJWT, getShippingByOrderId); 

router.get("/analytics/summary", verifyJWT, authorizeRoles("seller"), getShippingAnalytics); 

router.get("/:id", verifyJWT, getShippingById);

router.put("/bulk/status", verifyJWT, authorizeRoles("seller"), bulkUpdateShippingStatus); 

router.put("/soft-delete/:id", verifyJWT, authorizeRoles("seller"), softDeleteShipping); 

router.put("/restore/:id", verifyJWT, authorizeRoles("seller"), restoreShipping); 

router.put("/:id", verifyJWT, authorizeRoles("seller"), updateShipping); 
router.delete("/:id", verifyJWT, authorizeRoles("seller"),deleteShipping); 

export default router;
