import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkCreateTransactions,
  bulkUpdateTransactions,
  getTransactionsBySeller,
  getTransactionAnalytics,
  filterTransactions,
} from "../controllers/transaction.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getAllTransactions);
router.get("/:id", verifyJWT, getTransactionById);
router.get("/seller/:sellerId", verifyJWT, getTransactionsBySeller);
router.get("/analytics", verifyJWT, authorizeRoles("admin"), getTransactionAnalytics);
router.get("/filter", verifyJWT, filterTransactions);

router.post("/", verifyJWT, authorizeRoles("admin"), createTransaction);
router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateTransactions);
router.put("/:id", verifyJWT, authorizeRoles("admin"), updateTransaction);
router.put("/bulk/update", verifyJWT, authorizeRoles("admin"), bulkUpdateTransactions);
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteTransaction);

export default router;
