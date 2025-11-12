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

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createOrderItem);

router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateOrderItems);

router.get("/", verifyJWT, getAllOrderItems);

router.get("/:id", verifyJWT, getOrderItemById);

router.get("/order/:orderId", verifyJWT, getItemsByOrderId);

router.put("/:id", verifyJWT, updateOrderItem);

router.put("/bulk/update", verifyJWT, authorizeRoles("admin"), bulkUpdateOrderItems);

router.delete("/soft/:id", verifyJWT, authorizeRoles("admin"), softDeleteOrderItem);

router.patch("/restore/:id", verifyJWT, authorizeRoles("admin"), restoreOrderItem);

router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteOrderItem);

router.get("/analytics/summary", verifyJWT, authorizeRoles("admin"), getOrderItemsAnalytics);

router.get("/analytics/monthly", verifyJWT, authorizeRoles("admin"), getMonthlySalesReport);

router.get("/analytics/filter", verifyJWT, authorizeRoles("admin"), getLowStockOrHighValueItems);

export default router;
