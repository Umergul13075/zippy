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

const router = express.Router();

router.post("/create", createOrder);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);
router.get("/filter/by-status", getOrdersByStatus);
router.get("/filter/date-range", getOrdersInDateRange);
router.get("/user/:userId", getUserOrders);

router.get("/seller/:sellerId", getSellerOrders);
router.get("/recent", getRecentOrders);
router.get("/stats/total-sales", getTotalSales);
router.get("/stats/overview", getOrdersStats);

export default router;
