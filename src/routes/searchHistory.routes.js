import express from "express";
import {
  createSearchHistory,
  getAllSearchHistory,
  getSearchHistoryById,
  updateSearchHistory,
  deleteSearchHistory,
  bulkCreateSearchHistory,
  getTopSearchQueries,
  filterSearchHistory,
  getMonthlySearchReport
} from "../controllers/searchHistory.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js"; // Protect routes

const router = express.Router();

router.post("/", verifyJWT, createSearchHistory); 
router.get("/", verifyJWT, getAllSearchHistory); 
router.get("/filter", verifyJWT, filterSearchHistory);
router.post("/bulk", verifyJWT, authorizeRoles("seller"), bulkCreateSearchHistory);
router.get("/analytics/top-queries", verifyJWT, authorizeRoles("seller"), getTopSearchQueries);
router.get("/analytics/monthly-report", verifyJWT, authorizeRoles("seller"), getMonthlySearchReport);

router.get("/:id", verifyJWT, getSearchHistoryById);
router.put("/:id", verifyJWT, updateSearchHistory); 
router.delete("/:id", verifyJWT, deleteSearchHistory);


export default router;
