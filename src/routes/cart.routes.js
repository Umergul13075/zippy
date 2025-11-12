import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartItemCount,
  checkProductInCart,
  mergeGuestCart,
  getCartSummary,
} from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", verifyJWT, addToCart);
router.get("/", verifyJWT, getCart);
router.put("/update", verifyJWT, updateCartItem);
router.delete("/remove/:productId", verifyJWT, removeCartItem);
router.delete("/clear", verifyJWT, clearCart);
router.get("/count", verifyJWT, getCartItemCount);
router.get("/check/:productId", verifyJWT, checkProductInCart);
router.post("/merge-guest", verifyJWT, mergeGuestCart);
router.get("/summary", verifyJWT, getCartSummary);

export default router;
