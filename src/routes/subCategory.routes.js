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
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();


router.get("/", verifyJWT, getAllSubcategories);
router.get("/analytics", verifyJWT, authorizeRoles("admin"), getSubcategoryAnalytics);
router.get("/:id", verifyJWT, getSubcategoryById);

router.post("/", verifyJWT, authorizeRoles("admin"), createSubcategory);
router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateSubcategories);
router.put("/:id", verifyJWT, authorizeRoles("admin"), updateSubcategory);
router.put("/restore/:id", verifyJWT, authorizeRoles("admin"), restoreSubcategory);
router.put("/soft-delete/:id", verifyJWT, authorizeRoles("admin"), softDeleteSubcategory);
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteSubcategory);

export default router;
