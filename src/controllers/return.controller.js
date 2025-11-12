import { Return } from "../models/return.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const createReturnRequest = asyncHandler(async (req, res) => {
  const { order, product, reason, refundAmount } = req.body;
  if (!order || !product || !reason)
    throw new ApiError(400, "Order, product, and reason are required");

  const existing = await Return.findOne({ order, product, status: { $ne: "rejected" } });
  if (existing) throw new ApiError(400, "Return already requested for this product");

  const returnRequest = await Return.create({ order, product, reason, refundAmount: refundAmount || 0 });
  return res.status(201).json(new ApiResponse(true, "Return request created successfully", returnRequest));
});

const getAllReturns = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, sort = "-createdAt", status, order } = req.query;
  page = parseInt(page); limit = parseInt(limit);

  const filter = {};
  if (status) filter.status = status;
  if (order) filter.order = order;

  const returns = await Return.find(filter)
    .populate("order", "orderNumber user totalAmount")
    .populate("product", "name price")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Return.countDocuments(filter);

  return res.status(200).json(new ApiResponse(true, "Return requests fetched successfully", {
    data: returns,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }));
});


const getReturnById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid return ID");

  const returnRequest = await Return.findById(id)
    .populate("order", "orderNumber user")
    .populate("product", "name price")
    .lean();

  if (!returnRequest) throw new ApiError(404, "Return request not found");
  return res.status(200).json(new ApiResponse(true, "Return request fetched successfully", returnRequest));
});

const updateReturnStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, refundAmount } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid return ID");
  if (!["requested", "approved", "rejected", "refunded"].includes(status)) throw new ApiError(400, "Invalid status");

  const updated = await Return.findByIdAndUpdate(
    id,
    { status, refundAmount, resolvedAt: ["approved", "rejected", "refunded"].includes(status) ? new Date() : null },
    { new: true }
  ).lean();

  if (!updated) throw new ApiError(404, "Return request not found");
  return res.status(200).json(new ApiResponse(true, `Return status updated to ${status}`, updated));
});

const deleteReturnRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid return ID");

  const deleted = await Return.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Return request not found");
  return res.status(200).json(new ApiResponse(true, "Return request deleted successfully", deleted));
});

const getReturnsByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order ID");

  const returns = await Return.find({ order: orderId }).populate("product", "name price").lean();
  return res.status(200).json(new ApiResponse(true, "Returns fetched for order successfully", returns));
});

const getReturnAnalytics = asyncHandler(async (req, res) => {
  const result = await Return.aggregate([
    { $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRefunded: { $sum: { $cond: [{ $eq: ["$status", "refunded"] }, "$refundAmount", 0] } }
    }}
  ]);

  const summary = { requested: 0, approved: 0, rejected: 0, refunded: 0, totalRefunded: 0 };
  result.forEach(r => { summary[r._id] = r.count; summary.totalRefunded += r.totalRefunded; });

  return res.status(200).json(new ApiResponse(true, "Return analytics fetched successfully", summary));
});

const bulkCreateReturns = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{order, product, reason, refundAmount}, ...]
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "Items array required");

  const inserted = await Return.insertMany(items);
  return res.status(201).json(new ApiResponse(true, "Bulk return requests created", inserted));
});

const bulkUpdateReturnStatus = asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{id, status, refundAmount}, ...]
  if (!Array.isArray(updates) || updates.length === 0) throw new ApiError(400, "Updates array required");

  const results = [];
  for (const u of updates) {
    if (mongoose.Types.ObjectId.isValid(u.id)) {
      const updated = await Return.findByIdAndUpdate(u.id, {
        status: u.status,
        refundAmount: u.refundAmount,
        resolvedAt: ["approved", "rejected", "refunded"].includes(u.status) ? new Date() : null
      }, { new: true });
      if (updated) results.push(updated);
    }
  }

  return res.status(200).json(new ApiResponse(true, "Bulk return statuses updated", results));
});

const filterReturns = asyncHandler(async (req, res) => {
  const { type } = req.query;
  let filter = {};

  if (type === "high-refund") filter.refundAmount = { $gte: 5000 };
  if (type === "pending") filter.status = "requested";

  const returns = await Return.find(filter).populate("product", "name price").lean();
  return res.status(200).json(new ApiResponse(true, `Filtered returns (${type}) fetched`, returns));
});

const getMonthlyReturnReport = asyncHandler(async (req, res) => {
  const report = await Return.aggregate([
    { $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        totalReturns: { $sum: 1 },
        totalRefund: { $sum: "$refundAmount" }
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  return res.status(200).json(new ApiResponse(true, "Monthly return report generated", report));
});

export {
  createReturnRequest,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturnRequest,
  getReturnsByOrderId,
  getReturnAnalytics,
  bulkCreateReturns,
  bulkUpdateReturnStatus,
  filterReturns,
  getMonthlyReturnReport
};
