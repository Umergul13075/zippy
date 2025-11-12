import { Analytics } from "../models/logs.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const createLog = asyncHandler(async (req, res) => {
  const { user, action, entityId, ipAddress } = req.body;

  if (!action) throw new ApiError(400, "Action is required");

  const log = await Analytics.create({
    user,
    action,
    entityId,
    ipAddress,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, log, "Log created successfully"));
});


const getLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const logs = await Analytics.find()
    .populate("user", "name email") // optionally populate user info
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await Analytics.countDocuments();

  return res.status(200)
  .json(
    new ApiResponse(200, {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }, "Logs fetched successfully")
  );
});


const getLogById = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new ApiError(400, "Invalid log ID");
  }

  const log = await Analytics.findById(logId).populate("user", "name email");

  if (!log) throw new ApiError(404, "Log not found");

  return res.status(200)
  .json(new ApiResponse(200, log, "Log fetched successfully"));
});


const getLogsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const logs = await Analytics.find({ user: userId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return res.status(200)
  .json(new ApiResponse(200, logs, "Logs fetched for user"));
});


const getLogsByAction = asyncHandler(async (req, res) => {
  const { action } = req.params;

  const validActions = ["login", "view_product", "add_to_cart", "purchase", "logout"];
  if (!validActions.includes(action)) throw new ApiError(400, "Invalid action type");

  const logs = await Analytics.find({ action }).populate("user", "name email").sort({ createdAt: -1 });

  return res.status(200)
  .json(new ApiResponse(200, logs, `Logs for action: ${action}`));
});


const deleteLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new ApiError(400, "Invalid log ID");
  }

  const log = await Analytics.findById(logId);
  if (!log) throw new ApiError(404, "Log not found");

  await log.deleteOne();

  return res.status(200)
  .json(new ApiResponse(200, null, "Log deleted successfully"));
});


const getLogsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) throw new ApiError(400, "Start date and end date are required");

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) throw new ApiError(400, "Invalid date format");

    const logs = await Analytics.find({
    createdAt: { $gte: start, $lte: end },
    })
    .populate("user", "name email")
    .sort({ createdAt: -1 });


  return res.status(200)
  .json(new ApiResponse(200, logs, "Logs fetched for date range"));
});

const getLogsByEntity = asyncHandler(async (req, res) => {
  const { entityId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(entityId)) throw new ApiError(400, "Invalid entity ID");

  const logs = await Analytics.find({ entityId }).populate("user", "name email").sort({ createdAt: -1 });
  return res.status(200)
  .json(new ApiResponse(200, logs, "Logs fetched for entity"));
});


const getActionStats = asyncHandler(async (req, res) => {
  const stats = await Analytics.aggregate([
  { $group: { _id: "$action", count: { $sum: 1 } } },
  { $project: { _id: 0, action: "$_id", count: 1 } }
]);


  return res.status(200)
  .json(new ApiResponse(200, stats, "Action statistics fetched"));
});


const getMostActiveUsers = asyncHandler(async (req, res) => {
  const stats = await Analytics.aggregate([
  { $match: { user: { $ne: null } } },  // Only logs with a user
  { $group: { _id: "$user", actionCount: { $sum: 1 } } },
  { $sort: { actionCount: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",        // users collection
      localField: "_id",    // user ID from Analytics
      foreignField: "_id",  // _id in users collection
      as: "user",
    }
  },
  { $unwind: "$user" }       // Flatten the array
]);



  return res.status(200)
  .json(new ApiResponse(200, stats, "Most active users fetched"));
});


const clearAllLogs = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can clear all logs");
  }
  
  await Analytics.deleteMany();
  
  return res.status(200)
  .json(new ApiResponse(200, null, "All logs cleared successfully"));
});


const getLogsByIp = asyncHandler(async (req, res) => {
  const { ip } = req.params;
  if (!ip) throw new ApiError(400, "IP address is required");

  const logs = await Analytics.find({ ipAddress: ip }).populate("user", "name email").sort({ createdAt: -1 });
  return res.status(200)
  .json(new ApiResponse(200, logs, `Logs for IP: ${ip}`));
});


export {
  createLog,
  getLogs,
  getLogById,
  getLogsByUser,
  getLogsByAction,
  deleteLog,
  getLogsByDateRange,
  getLogsByEntity,
  getMostActiveUsers,
  getActionStats,
  clearAllLogs,
  getLogsByIp
};
