import express from "express";
import {
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  bulkCreateOrderItems,
  getAllOrderItems,
  getItemsByOrderId,
  getOrderItemById,
  softDeleteOrderItem,
  restoreOrderItem,
  getOrderItemsAnalytics,
  getLowStockOrHighValueItems,
  bulkUpdateOrderItems,
  getMonthlySalesReport,
} from "../controllers/orderItem.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createOrderItem);

router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateOrderItems);

router.get("/", verifyJWT, getAllOrderItems);

router.get("/:id", verifyJWT, getOrderItemById);

router.get("/order/:orderId", verifyJWT, getItemsByOrderId);

router.put("/:id", verifyJWT, updateOrderItem);

router.put("/bulk/update", verifyJWT, authorizeRoles("seller"), bulkUpdateOrderItems);

router.delete("/soft/:id", verifyJWT, authorizeRoles("seller"), softDeleteOrderItem);

router.patch("/restore/:id", verifyJWT, authorizeRoles("seller"), restoreOrderItem);

router.delete("/:id", verifyJWT, authorizeRoles("seller"), deleteOrderItem);

router.get("/analytics/summary", verifyJWT, authorizeRoles("seller"), getOrderItemsAnalytics);

router.get("/analytics/monthly", verifyJWT, authorizeRoles("seller"), getMonthlySalesReport);

router.get("/analytics/filter", verifyJWT, authorizeRoles("seller"), getLowStockOrHighValueItems);

export default router;
