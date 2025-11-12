import express from "express";
import {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  adjustInventoryQuantity,
  getInventoryBySeller,
  searchInventory,
  getLowStockInventories,
  bulkUpdateInventory,
  getInventoryStats,
  getInventoryByVariant,
  clearInventory
} from "../controllers/inventory.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; 
import { authorizeRoles } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

// Protected routes for all authenticated users
router.use(verifyJWT);


router.post("/", createInventory);
router.get("/", getInventories); 
router.get("/:inventoryId", getInventoryById); 
router.put("/:inventoryId", updateInventory); 
router.delete("/:inventoryId", deleteInventory);

router.put("/:inventoryId/adjust", adjustInventoryQuantity);


router.get("/seller/:sellerId", getInventoryBySeller);


router.get("/search", searchInventory);


router.get("/low-stock", getLowStockInventories); 
router.post("/bulk-update", bulkUpdateInventory); 
router.get("/stats", getInventoryStats); 
router.get("/variant/:variantId", getInventoryByVariant);

// Admin only route to clear inventories
router.delete("/clear", authorizeRoles, clearInventory); 

export default router;
