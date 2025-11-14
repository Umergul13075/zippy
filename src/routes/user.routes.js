import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  forgotPassword,
  resetPassword,
  getUserById,
  deleteUser,
  deactivateAccount,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser); 
router.post("/login", loginUser);           
router.post("/forgot-password", forgotPassword);  
router.post("/reset-password", resetPassword);   
router.get("/refresh-token", refreshAccessToken);
router.use(verifyJWT);
router.get("/me", getCurrentUser);
router.put("/update", updateAccountDetails);
router.put("/change-password", changeCurrentPassword);
router.post("/logout", logoutUser);  
router.delete("/delete", deleteUser);
router.put("/deactivate", deactivateAccount);    
router.get("/:id", getUserById);

export default router;
