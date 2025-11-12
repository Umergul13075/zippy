import { Notification } from "../models/notifications.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const createNotification = asyncHandler(async (req, res) => {
  const { user, message, type } = req.body;

  if (!user || !message || !type) {
    throw new ApiError(400, "User, message, and type are required");
  }

  const notification = await Notification.create({ user, message, type });

  return res.status(201)
  .json(new ApiResponse(201, notification, "Notification created successfully"));
});


const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const notifications = await Notification.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Notification.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }, "Notifications fetched successfully")
  );
});


const getNotificationsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const notifications = await Notification.find({ user: userId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return res.status(200)
  .json(new ApiResponse(200, notifications, "User notifications fetched successfully"));
});


const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findByIdAndUpdate(
    id,
    { status: "read" },
    { new: true }
  );

  if (!notification) throw new ApiError(404, "Notification not found");

  return res.status(200)
  .json(new ApiResponse(200, notification, "Notification marked as read"));
});


const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findById(id);
  if (!notification) throw new ApiError(404, "Notification not found");

  await notification.deleteOne();

  return res.status(200)
  .json(new ApiResponse(200, null, "Notification deleted successfully"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const result = await Notification.updateMany(
    { user: userId, status: "unread" },
    { status: "read" }
  );

  return res.status(200)
  .json(new ApiResponse(200, result, "All notifications marked as read"));
});

const getUnreadNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const notifications = await Notification.find({ user: userId, status: "unread" })
  .populate("user", "name email")  
  .sort({ createdAt: -1 });

  return res.status(200)
  .json(new ApiResponse(200, notifications, "Unread notifications fetched successfully"));
});

const countUnreadNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const count = await Notification.countDocuments({ user: userId, status: "unread" });

  return res.status(200)
  .json(new ApiResponse(200, { unreadCount: count }, "Unread notifications count fetched"));
});

const deleteAllNotificationsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!req.user || req.user.role !== "admin")
    throw new ApiError(403, "Only admin can perform this action");


  await Notification.deleteMany({ user: userId });

  return res.status(200)
  .json(new ApiResponse(200, null, "All notifications deleted for user"));
});

const getNotificationsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const validTypes = ["order", "promotion", "system", "chat"];

  if (!validTypes.includes(type)) {
    throw new ApiError(400, "Invalid notification type");
  }

  const notifications = await Notification.find({ type })
    .populate("user", "name email")  
    .sort({ createdAt: -1 });

  return res.status(200)
  .json(new ApiResponse(200, notifications, `Notifications of type ${type} fetched`));
});


export {
  createNotification,
  getNotifications,
  getNotificationsByUser,
  markAsRead,
  deleteNotification,
  markAllAsRead,
  getUnreadNotifications,
  countUnreadNotifications,
  deleteAllNotificationsForUser,
  getNotificationsByType
};
