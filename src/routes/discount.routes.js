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

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getCoupons);
router.get("/active", verifyJWT, getActiveCoupons);
router.get("/search", verifyJWT, searchCoupons);
router.get("/my-used", verifyJWT, getUserUsedCoupons);
router.get("/expired", verifyJWT, getExpiredCoupons);
router.get("/:couponId", verifyJWT, getCouponById);

router.post("/", verifyJWT, authorizeRoles("admin"), createCoupon);
router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateCoupons);
router.put("/:couponId", verifyJWT, authorizeRoles("admin"), updateCoupon);
router.put("/toggle/:couponId", verifyJWT, authorizeRoles("admin"), toggleCouponStatus);
router.delete("/:couponId", verifyJWT, authorizeRoles("admin"), deleteCoupon);
router.delete("/remove-user/:couponId/:userId", verifyJWT, authorizeRoles("admin"), removeUserFromCoupon);

router.post("/apply", verifyJWT, applyCoupon);

router.get("/stats/summary", verifyJWT, authorizeRoles("admin"), getCouponStats);

export default router;
