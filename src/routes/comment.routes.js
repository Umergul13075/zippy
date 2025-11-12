import express from "express";
import {
  addComment,
  editComment,
  deleteComment,
  toggleLikeOnComment,
  getCommentsByReview,
  getCommentById,
  getCommentsByUser,
  deleteCommentsByReview,
  getCommentCountForReview,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; // must exist

const router = express.Router();
router.post("/:reviewId", verifyJWT, addComment);
router.put("/:commentId", verifyJWT, editComment);
router.delete("/:commentId", verifyJWT, deleteComment);
router.patch("/:commentId/like", verifyJWT, toggleLikeOnComment);
router.get("/review/:reviewId", getCommentsByReview);
router.get("/:commentId", getCommentById);
router.get("/user/:userId", getCommentsByUser);
router.delete("/review/:reviewId", verifyJWT, deleteCommentsByReview);
router.get("/review/:reviewId/count", getCommentCountForReview);

export default router;
