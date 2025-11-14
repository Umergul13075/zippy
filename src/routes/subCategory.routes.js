import express from "express";
import {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategory,
  softDeleteSubcategory,
  restoreSubcategory,
  deleteSubcategory,
  bulkCreateSubcategories,
  getSubcategoryAnalytics
} from "../controllers/subCategory.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.get("/", verifyJWT, getAllSubcategories);
router.get("/analytics", verifyJWT, authorizeRoles("seller"), getSubcategoryAnalytics);
router.get("/:id", verifyJWT, getSubcategoryById);

router.post("/", verifyJWT, authorizeRoles("seller"), createSubcategory);
router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateSubcategories);
router.put("/:id", verifyJWT, authorizeRoles("seller"), updateSubcategory);
router.put("/restore/:id", verifyJWT, authorizeRoles("seller"), restoreSubcategory);
router.put("/soft-delete/:id", verifyJWT, authorizeRoles("seller"), softDeleteSubcategory);
router.delete("/:id", verifyJWT, authorizeRoles("seller"), deleteSubcategory);

export default router;
