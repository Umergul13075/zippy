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

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js"; 
 

const router = express.Router();

// Protected routes for all authenticated users
router.use(verifyJWT);


router.post("/", authorizeRoles("seller"), createInventory);
router.put("/:inventoryId", authorizeRoles("seller"), updateInventory); 
router.delete("/:inventoryId", authorizeRoles("seller"), deleteInventory);
router.put("/:inventoryId/adjust", authorizeRoles("seller"), adjustInventoryQuantity);
router.post("/bulk-update", authorizeRoles("seller"), bulkUpdateInventory);
router.get("/seller/:sellerId", authorizeRoles("seller"), getInventoryBySeller);
router.get("/stats", authorizeRoles("seller"), getInventoryStats); 


router.get("/", getInventories); 
router.get("/:inventoryId",getInventoryById); 
router.get("/variant/:variantId", getInventoryByVariant);
router.get("/search", searchInventory);
router.get("/low-stock", authorizeRoles("seller"), getLowStockInventories); 




// work in controller to do
// router.delete("/clear", authorizeRoles ("seller"), clearInventory); 

export default router;
