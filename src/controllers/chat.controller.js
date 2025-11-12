import { Chat } from "../models/chat.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const createChat = asyncHandler(async (req, res) => {
  const { userId, sellerId } = req.body;

  if (!userId || !sellerId) {
    throw new ApiError(400, "User ID and Seller ID are required");
  }

  // Check if chat already exists
  let chat = await Chat.findOne({ user: userId, seller: sellerId });

  if (chat) {
    return res
      .status(200)
      .json(new ApiResponse(200, chat, "Chat already exists"));
  }

  chat = await Chat.create({
    user: userId,
    seller: sellerId,
    messages: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, chat, "Chat created successfully"));
});


const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const senderId = req.user._id;
  const senderRole = req.user.role; // "user" or "seller"

  if (!content) {
    throw new ApiError(400, "Message content is required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (
    !(
      chat.user.toString() === senderId.toString() ||
      chat.seller.toString() === senderId.toString()
    )
  ) {
    throw new ApiError(403, "You are not authorized to send messages in this chat");
  }

  const message = {
    senderType: senderRole,
    senderId,
    content,
  };

  chat.messages.push(message);
  await chat.save();

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Message sent successfully"));
});


const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chat ID");
  }

  const chat = await Chat.findById(chatId)
   .populate("messages.senderId", "name email")

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  // Only participants or admin can view
  if (
    req.user.role !== "admin" &&
    chat.user.toString() !== req.user._id.toString() &&
    chat.seller.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to view this chat");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat retrieved successfully"));
});


const getMyChats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let filter = {};

  if (req.user.role === "user") {
    filter.user = req.user._id;
  } else if (req.user.role === "seller") {
    filter.seller = req.user._id;
  } else {
    throw new ApiError(403, "Only users or sellers can view their chats");
  }

  const chats = await Chat.find(filter)
    .populate("user", "name email")
    .populate("seller", "name email")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ updatedAt: -1 });

  const total = await Chat.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      chats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    }, "Chats fetched successfully")
  );
});

const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        throw new ApiError(400, "Invalid chat ID");
    }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  // Allow only participants or admin
  if (
    req.user.role !== "admin" &&
    chat.user.toString() !== req.user._id.toString() &&
    chat.seller.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to delete this chat");
  }

  await chat.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Chat deleted successfully"));
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const message = chat.messages.id(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (
    req.user.role !== "admin" &&
    message.senderId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to delete this message");
  }

    chat.messages.pull({ _id: messageId });
    await chat.save();


  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Message deleted successfully"));
});

const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { senderType } = req.body; // "user" or "seller"

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  // Example field if you want: add `isRead` to messages in schema
  chat.messages.forEach((msg) => {
    if (msg.senderType !== req.user.role) {
        msg.isRead = true;
    }
    });


  await chat.save();

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Messages marked as read"));
});


const getAllChatsForAdmin = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin access only");
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const chats = await Chat.find()
    .populate("user", "name email")
    .populate("seller", "name email")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ updatedAt: -1 });

  const total = await Chat.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      chats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    }, "All chats fetched successfully")
  );
});

const searchChats = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) throw new ApiError(400, "Search query required");

  const chats = await Chat.find({
  $or: [
    { "user.name": { $regex: query, $options: "i" } },
    { "seller.name": { $regex: query, $options: "i" } },
    { "user.email": { $regex: query, $options: "i" } },
    { "seller.email": { $regex: query, $options: "i" } },
  ],
})
    .populate("user", "name email")
    .populate("seller", "name email");

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chats search result"));
});


const getOrCreateChat = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const userId = req.user._id;

  let chat = await Chat.findOne({ user: userId, seller: sellerId })
    .populate("user", "name email")
    .populate("seller", "name email");

  if (!chat) {
    chat = await Chat.create({ user: userId, seller: sellerId, messages: [] });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat fetched or created successfully"));
});

const getChatPreviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let filter = {};
  if (req.user.role === "user") filter.user = req.user._id;
  else if (req.user.role === "seller") filter.seller = req.user._id;

  const chats = await Chat.find(filter)
    .select("user seller messages updatedAt")
    .populate("user", "name")
    .populate("seller", "name")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const previews = chats.map((chat) => ({
    _id: chat._id,
    participant:
      req.user.role === "user" ? chat.seller?.name : chat.user?.name,
    lastMessage:
      chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].content
        : "No messages yet",
    lastMessageTime:
      chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].timestamp
        : chat.updatedAt,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, previews, "Chat previews fetched successfully"));
});

const clearChatHistory = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
  throw new ApiError(400, "Invalid chat ID");
}

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  if (
    chat.user.toString() !== req.user._id.toString() &&
    chat.seller.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to clear this chat");
  }

  chat.messages = [];
  await chat.save();

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat history cleared successfully"));
});

const reportChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new ApiError(400, "Invalid chat ID");
  }

  if (!reason) throw new ApiError(400, "Report reason is required");

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  chat.report = {
    reportedBy: req.user._id,
    reason,
    reportedAt: new Date(),
  };

  await chat.save();

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Chat reported successfully"));
});

const resolveReportedChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
  throw new ApiError(400, "Invalid chat ID");
    }

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.report) throw new ApiError(404, "No report found");

  chat.report.resolved = true;
  chat.report.resolvedAt = new Date();

  await chat.save();

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Report resolved successfully"));
});


export {
    createChat,
    sendMessage,
    getChatById,
    getMyChats,
    getAllChatsForAdmin,
    deleteChat,
    deleteMessage,
    markMessagesAsRead,
    searchChats,
    clearChatHistory,
    getChatPreviews,
    getOrCreateChat,
    resolveReportedChat,
    reportChat
}