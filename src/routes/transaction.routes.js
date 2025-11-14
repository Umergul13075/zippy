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
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/seller/:sellerId", verifyJWT, getTransactionsBySeller);
router.get("/analytics", verifyJWT, authorizeRoles("seller"), getTransactionAnalytics);
router.get("/filter", verifyJWT, filterTransactions);
router.get("/", verifyJWT, getAllTransactions);
router.get("/:id", verifyJWT, getTransactionById);

router.post("/", verifyJWT, authorizeRoles("seller"), createTransaction);
router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateTransactions);
router.put("/:id", verifyJWT, authorizeRoles("seller"), updateTransaction);
router.put("/bulk/update", verifyJWT, authorizeRoles("seller"), bulkUpdateTransactions);
router.delete("/:id", verifyJWT, authorizeRoles("seller"), deleteTransaction);

export default router;
