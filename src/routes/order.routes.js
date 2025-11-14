import express from "express";
import {
  createOrder,
  getOrderById,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  deleteOrder,
  getOrdersByStatus,
  getSellerOrders,
  getRecentOrders,
  getTotalSales,
  getOrdersStats,
  getOrdersInDateRange,
} from "../controllers/order.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", verifyJWT, createOrder);

router.get("/", getAllOrders);

router.get("/:id", verifyJWT, getOrderById);

router.put("/:id/status" , verifyJWT, authorizeRoles("seller"), updateOrderStatus);

router.delete("/:id", verifyJWT, deleteOrder);

router.get("/filter/by-status" , verifyJWT, authorizeRoles("seller"), getOrdersByStatus);

router.get("/filter/date-range" , verifyJWT, authorizeRoles("seller"), getOrdersInDateRange);

router.get("/user/:userId", verifyJWT, getUserOrders);

router.get("/seller/:sellerId", verifyJWT, authorizeRoles("seller"), getSellerOrders);

router.get("/recent" , verifyJWT, authorizeRoles("seller"), getRecentOrders);

router.get("/stats/total-sales", verifyJWT, authorizeRoles("seller"), getTotalSales);

router.get("/stats/overview", verifyJWT, authorizeRoles("seller"), getOrdersStats);

export default router;
