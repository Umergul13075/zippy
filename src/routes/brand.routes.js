import express from "express";
import {
  createBrand,
  updateBrand,
  getBrands,
  getBrandById,
  deleteBrand,
  getActiveBrands,
} from "../controllers/brand.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; 

const router = express.Router();


router.post("/", verifyJWT, createBrand);
router.put("/:id", verifyJWT, updateBrand);
router.delete("/:id", verifyJWT, deleteBrand);

router.get("/", getBrands);
router.get("/active", getActiveBrands);
router.get("/:id", getBrandById);

export default router;
