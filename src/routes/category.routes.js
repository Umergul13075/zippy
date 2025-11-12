import express from "express";
import {
  createCategory,
  getCategoryById,
  updateCategory,
  getAllCategories,
  deleteCategory,
  getActiveCategories,
  searchCategoriesByName,
  getSubCategories,
} from "../controllers/category.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; // assuming you already have multer setup for file upload

const router = express.Router();


router.post("/", upload.single("icon"), createCategory);
router.get("/", getAllCategories);
router.get("/active", getActiveCategories);
router.get("/search", searchCategoriesByName);
router.get("/subcategories/:parentId", getSubCategories);
router.get("/:id", getCategoryById);
router.put("/:id", upload.single("icon"), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
