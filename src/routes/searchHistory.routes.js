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

import { verifyJWT } from "../middlewares/auth.middleware.js"; // Protect routes
import { authorizeRoles } from "../middlewares/role.middleware.js"; // Optional admin-only routes

const router = express.Router();

router.post("/", verifyJWT, createSearchHistory); // create a search
router.get("/", verifyJWT, getAllSearchHistory); // list all search histories
router.get("/:id", verifyJWT, getSearchHistoryById); // get single search history
router.put("/:id", verifyJWT, updateSearchHistory); // update a search history
router.delete("/:id", verifyJWT, deleteSearchHistory); // delete a search history

router.post("/bulk", verifyJWT, authorizeRoles("admin"), bulkCreateSearchHistory);

router.get("/analytics/top-queries", verifyJWT, authorizeRoles("admin"), getTopSearchQueries);
router.get("/analytics/monthly-report", verifyJWT, authorizeRoles("admin"), getMonthlySearchReport);
router.get("/filter", verifyJWT, filterSearchHistory); // filter search by keyword

export default router;
