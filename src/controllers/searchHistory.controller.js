import { SearchHistory } from "../models/searchHistory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const createSearchHistory = asyncHandler(async (req, res) => {
  const { user_id, search_query } = req.body;
  if (!search_query) throw new ApiError(400, "Search query is required");

  const searchEntry = await SearchHistory.create({ user_id, search_query });
  return res.status(201).json(new ApiResponse(true, "Search history created", searchEntry));
});

const getAllSearchHistory = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, user_id } = req.query;
  page = parseInt(page); limit = parseInt(limit);

  const filter = {};
  if (user_id && mongoose.Types.ObjectId.isValid(user_id)) filter.user_id = user_id;

  const history = await SearchHistory.find(filter)
    .sort({ searched_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await SearchHistory.countDocuments(filter);

  return res.status(200).json(new ApiResponse(true, "Search history fetched", {
    data: history,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }));
});

const getSearchHistoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid ID");

  const entry = await SearchHistory.findById(id).lean();
  if (!entry) throw new ApiError(404, "Search history not found");

  return res.status(200).json(new ApiResponse(true, "Search history fetched", entry));
});

const updateSearchHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { search_query } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid ID");
  if (!search_query) throw new ApiError(400, "Search query is required");

  const updated = await SearchHistory.findByIdAndUpdate(id, { search_query }, { new: true, runValidators: true }).lean();
  if (!updated) throw new ApiError(404, "Search history not found");

  return res.status(200).json(new ApiResponse(true, "Search history updated", updated));
});

const deleteSearchHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid ID");

  const deleted = await SearchHistory.findByIdAndDelete(id).lean();
  if (!deleted) throw new ApiError(404, "Search history not found");

  return res.status(200).json(new ApiResponse(true, "Search history deleted", deleted));
});

const bulkCreateSearchHistory = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ user_id, search_query }, ...]
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "Items array required");

  const inserted = await SearchHistory.insertMany(items);
  return res.status(201).json(new ApiResponse(true, "Bulk search history created", inserted));
});

const getTopSearchQueries = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const result = await SearchHistory.aggregate([
    { $group: { _id: "$search_query", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return res.status(200).json(new ApiResponse(true, "Top search queries fetched", result));
});

const filterSearchHistory = asyncHandler(async (req, res) => {
  const { keyword, user_id } = req.query;
  if (!keyword) throw new ApiError(400, "Keyword required");

  const filter = { search_query: { $regex: keyword, $options: "i" } };
  if (user_id && mongoose.Types.ObjectId.isValid(user_id)) filter.user_id = user_id;

  const results = await SearchHistory.find(filter).sort({ searched_at: -1 }).lean();
  return res.status(200).json(new ApiResponse(true, `Search history filtered by "${keyword}"`, results));
});

const getMonthlySearchReport = asyncHandler(async (req, res) => {
  const report = await SearchHistory.aggregate([
    { $group: { _id: { month: { $month: "$searched_at" }, year: { $year: "$searched_at" } }, count: { $sum: 1 } } },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  return res.status(200).json(new ApiResponse(true, "Monthly search report generated", report));
});

export {
  createSearchHistory,
  getAllSearchHistory,
  getSearchHistoryById,
  updateSearchHistory,
  deleteSearchHistory,
  bulkCreateSearchHistory,
  getTopSearchQueries,
  filterSearchHistory,
  getMonthlySearchReport
};
