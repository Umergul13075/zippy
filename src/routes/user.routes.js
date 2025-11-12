import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  // updateUserAvatar,
  // updateUserCoverImage,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateAccountStatus,
  deleteUser,
  deactivateAccount,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
// import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

/* -----------------------------  AUTH ROUTES ----------------------------- */
router.post(
  "/register", registerUser);

router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);

/* --------------------------- PASSWORD ROUTES ---------------------------- */
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

/* -------------------------- PROFILE ROUTES ----------------------------- */
router.get("/me", verifyJWT, getCurrentUser);
router.put("/update-account", verifyJWT, updateAccountDetails);

// router.put(
//   "/update-avatar",
//   verifyJWT,
//   upload.single("avatar"),
//   updateUserAvatar
// );

// router.put(
//   "/update-cover",
//   verifyJWT,
//   upload.single("coverImage"),
//   updateUserCoverImage
// );

/* ------------------------ USER SELF ACTIONS ---------------------------- */
router.put("/deactivate", verifyJWT, deactivateAccount);
router.delete("/delete/:id", verifyJWT, deleteUser);

/* --------------------------- ADMIN ROUTES ------------------------------ */
router.get(
  "/admin/all",
  verifyJWT,
  authorizeRoles("admin"),
  getAllUsers
);

router.get(
  "/admin/:id",
  verifyJWT,
  authorizeRoles("admin"),
  getUserById
);

router.put(
  "/admin/role/:id",
  verifyJWT,
  authorizeRoles("admin"),
  updateUserRole
);

router.put(
  "/admin/status/:id",
  verifyJWT,
  authorizeRoles("admin"),
  updateAccountStatus
);

export default router;
