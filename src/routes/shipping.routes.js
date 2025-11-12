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
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createShipping);
router.get("/", verifyJWT, getAllShippings); 
router.get("/:id", verifyJWT, getShippingById);
router.get("/order/:orderId", verifyJWT, getShippingByOrderId); 

router.put("/:id", verifyJWT, authorizeRoles("admin"), updateShipping); 
router.put("/bulk/status", verifyJWT, authorizeRoles("admin"), bulkUpdateShippingStatus); 
router.put("/soft-delete/:id", verifyJWT, authorizeRoles("admin"), softDeleteShipping); 
router.put("/restore/:id", verifyJWT, authorizeRoles("admin"), restoreShipping); 
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteShipping); 
router.get("/analytics/summary", verifyJWT, authorizeRoles("admin"), getShippingAnalytics); 

export default router;
