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

import { verifyJWT} from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/", verifyJWT, createBanner);
router.get("/", verifyJWT, getBanners);
router.get("/:id", verifyJWT, getBannerById);
router.put("/:id", verifyJWT,  updateBanner);
router.delete("/:id", verifyJWT, deleteBanner);
router.put("/bulk/display-order", verifyJWT, bulkUpdateDisplayOrder);


router.get("/active", getActiveBanners);

export default router;
