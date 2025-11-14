import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  deleteReview,
  updateReview,
  getReviewsByProduct,
  toggleReviewLike,
  getAverageRatingForProduct,
  getReviewsByUser,
  getTopRatedProducts,
} from "../controllers/review.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; // ensure this exists

const router = express.Router();


router.post("/", verifyJWT, createReview);
router.get("/", getAllReviews);
router.get("/product/:productId", getReviewsByProduct);
router.get("/product/:productId/average", getAverageRatingForProduct);
router.get("/user/:userId", getReviewsByUser);
router.get("/top", getTopRatedProducts);
router.patch("/:id/like", verifyJWT, toggleReviewLike);
router.put("/:id", verifyJWT, updateReview);
router.delete("/:id", verifyJWT, deleteReview);
router.get("/:id", getReviewById);

export default router;
