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

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();


router.post(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
  createNotification
);

router.get(
  "/",
  verifyJWT,
  authorizeRoles("admin"),
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
  authorizeRoles("admin"),
  deleteAllNotificationsForUser
);


router.get(
  "/type/:type",
  verifyJWT,
  authorizeRoles("admin"),
  getNotificationsByType
);

export default router;
