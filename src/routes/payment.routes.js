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

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js"; 


const router = express.Router();


router.post("/", verifyJWT, createPayment);
router.patch("/:id/retry", verifyJWT, retryPayment); 
router.get("/user/:userId", verifyJWT, getUserPayments); 

router.get("/seller/:sellerId", verifyJWT, authorizeRoles("seller"), getSellerPayments); 

router.get("/:id", verifyJWT, getPaymentById);


// admin routes
router.get("/", verifyJWT, authorizeRoles("seller"), getAllPayments);

router.get("/stats", verifyJWT, authorizeRoles("seller"), getPaymentStats);


router.get("/recent", verifyJWT, authorizeRoles("seller"), getRecentPayments);


router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);


router.get("/filter", verifyJWT, authorizeRoles("seller"), getPaymentsByFilter);




router.patch("/:id/status", verifyJWT, authorizeRoles("seller"), updatePaymentStatus); 


router.patch("/:id/refund", verifyJWT, authorizeRoles("seller"), refundPayment); 


router.delete("/:id", verifyJWT, authorizeRoles("seller"), deletePayment);

export default router;
