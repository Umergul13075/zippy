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

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, authorizeRoles("seller"), createSeller);

router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateSellers);

router.get("/analytics/summary", verifyJWT, authorizeRoles("seller"), getSellerAnalytics);

router.get("/", verifyJWT, authorizeRoles("seller"), getAllSellers);

router.get("/top", verifyJWT, getTopSellers);

router.get("/search", verifyJWT, searchSellers);

router.put("/soft-delete/:id", verifyJWT, authorizeRoles("seller"), softDeleteSeller);

router.put("/restore/:id", verifyJWT, authorizeRoles("seller"), restoreSeller);

router.get("/:id", verifyJWT, getSellerById);

router.put("/:id", verifyJWT, updateSeller);


export default router;
