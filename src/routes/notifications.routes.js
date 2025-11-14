import express from "express";
import {
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
} from "../controllers/notifications.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post(
  "/",
  verifyJWT,
  authorizeRoles("seller"),
  createNotification
);

router.get(
  "/",
  verifyJWT,
  authorizeRoles("seller"),
  getNotifications
);

router.get(
  "/user/:userId",
  verifyJWT,
  getNotificationsByUser
);

router.get(
  "/user/:userId/unread",
  verifyJWT,
  getUnreadNotifications
);


router.get(
  "/user/:userId/unread/count",
  verifyJWT,
  countUnreadNotifications
);


router.patch(
  "/:notificationId/read",
  verifyJWT,
  markAsRead
);


router.patch(
  "/user/:userId/read-all",
  verifyJWT,
  markAllAsRead
);


router.delete(
  "/:notificationId",
  verifyJWT,
  deleteNotification
);


router.delete(
  "/user/:userId",
  verifyJWT,
  authorizeRoles("seller"),
  deleteAllNotificationsForUser
);


router.get(
  "/type/:type",
  verifyJWT,
  authorizeRoles("seller"),
  getNotificationsByType
);

export default router;
