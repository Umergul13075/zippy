import express from "express";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  toggleCouponStatus,
  getActiveCoupons,
  searchCoupons,
  getUserUsedCoupons,
  bulkCreateCoupons,
  getCouponStats,
  removeUserFromCoupon,
  getExpiredCoupons
} from "../controllers/discount.controller.js";

import { verifyJWT, authorizeRoles  } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getCoupons);
router.get("/active", verifyJWT, getActiveCoupons);
router.get("/search", verifyJWT, searchCoupons);
router.get("/my-used", verifyJWT, getUserUsedCoupons);
router.get("/expired", verifyJWT, getExpiredCoupons);
router.get("/:couponId", verifyJWT, getCouponById);

router.post("/apply", verifyJWT, applyCoupon);
router.post("/", verifyJWT, authorizeRoles("seller"), createCoupon);
router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateCoupons);
router.put("/:couponId", verifyJWT, authorizeRoles("seller"), updateCoupon);
router.put("/toggle/:couponId", verifyJWT, authorizeRoles("seller"), toggleCouponStatus);
router.delete("/:couponId", verifyJWT, authorizeRoles("seller"), deleteCoupon);
router.delete("/remove-user/:couponId/:userId", verifyJWT, authorizeRoles("seller"), removeUserFromCoupon);


router.get("/stats/summary", verifyJWT, authorizeRoles("seller"), getCouponStats);

export default router;
