import express from "express";
import {
  createBrand,
  updateBrand,
  getBrands,
  getBrandById,
  deleteBrand,
  getActiveBrands,
} from "../controllers/brand.controller.js";
import { authorizeRoles } from "../middlewares/role.middleware.js"; 
import { verifyJWT } from "../middlewares/auth.middleware.js"; 

const router = express.Router();


router.post("/", verifyJWT, authorizeRoles ("admin"), createBrand);
router.get("/", getBrands);
router.get("/active", getActiveBrands);
router.get("/:id", getBrandById);
router.put("/:id", verifyJWT, authorizeRoles ("admin"), updateBrand);
router.delete("/:id", verifyJWT, authorizeRoles ("admin"), deleteBrand);

export default router;
