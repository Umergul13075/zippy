import express from "express";
import {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  softDeleteSeller,
  restoreSeller,
  bulkCreateSellers,
  getSellerAnalytics,
  getTopSellers,
  searchSellers
} from "../controllers/seller.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, authorizeRoles("admin"), createSeller);

router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateSellers);

router.get("/", verifyJWT, authorizeRoles("admin"), getAllSellers);

router.get("/:id", verifyJWT, getSellerById);

router.put("/:id", verifyJWT, updateSeller);

router.put("/soft-delete/:id", verifyJWT, authorizeRoles("admin"), softDeleteSeller);

router.put("/restore/:id", verifyJWT, authorizeRoles("admin"), restoreSeller);

router.get("/analytics/summary", verifyJWT, authorizeRoles("admin"), getSellerAnalytics);

router.get("/top", verifyJWT, getTopSellers);

router.get("/search", verifyJWT, searchSellers);

export default router;
