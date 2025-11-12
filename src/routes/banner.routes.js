import express from "express";
import {
    createBanner,
    getBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
    getActiveBanners,
    bulkUpdateDisplayOrder
} from "../controllers/banner.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/", verifyJWT, authorizeRoles("admin"), createBanner);
router.get("/", verifyJWT, authorizeRoles("admin"), getBanners);
router.get("/:id", verifyJWT, authorizeRoles("admin"), getBannerById);
router.put("/:id", verifyJWT, authorizeRoles("admin"), updateBanner);
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteBanner);
router.put("/bulk/display-order", verifyJWT, authorizeRoles("admin"), bulkUpdateDisplayOrder);


router.get("/active", getActiveBanners);

export default router;
