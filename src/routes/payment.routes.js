import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
  updatePaymentStatus,
  getPaymentsByFilter,
  getUserPayments,
  getSellerPayments,
  refundPayment,
  retryPayment,
  getPaymentStats,
  getRecentPayments,
  handleStripeWebhook,
} from "../controllers/payment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; 
import { authorizeRoles } from "../middlewares/role.middleware.js"; 

const router = express.Router();


router.post("/", verifyJWT, createPayment);
router.get("/user/:userId", verifyJWT, getUserPayments); 
router.patch("/:id/retry", verifyJWT, retryPayment); 

router.get("/seller/:sellerId", verifyJWT, authorizeRoles("seller", "admin"), getSellerPayments); 

// admin routes
router.get("/", verifyJWT, authorizeRoles("admin"), getAllPayments);
router.get("/stats", verifyJWT, authorizeRoles("admin"), getPaymentStats);
router.get("/recent", verifyJWT, authorizeRoles("admin"), getRecentPayments);
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
router.get("/filter", verifyJWT, authorizeRoles("admin"), getPaymentsByFilter);
router.get("/:id", verifyJWT, authorizeRoles("admin", "seller", "user"), getPaymentById);
router.patch("/:id/status", verifyJWT, authorizeRoles("admin"), updatePaymentStatus); 
router.patch("/:id/refund", verifyJWT, authorizeRoles("admin"), refundPayment); 
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deletePayment);

export default router;
