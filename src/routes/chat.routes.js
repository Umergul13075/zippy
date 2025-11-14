import express from "express";
import {
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
} from "../controllers/chat.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; // adjust path if needed

const router = express.Router();
router.use(verifyJWT);
router.post("/", createChat);
router.get("/my-chats", getMyChats);
router.get("/user/:sellerId", getOrCreateChat);
router.post("/:chatId/message", sendMessage);
router.delete("/:chatId/message/:messageId", deleteMessage);
router.put("/:chatId/mark-read", markMessagesAsRead);
router.delete("/:chatId/clear", clearChatHistory);
router.get("/:chatId", getChatById);
router.get("/previews/list", getChatPreviews);
router.post("/:chatId/report", reportChat);

router.get("/search", searchChats);


router.delete("/:chatId", deleteChat);

export default router;
