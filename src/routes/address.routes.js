import express from "express";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  getAddressById,
  getUserAddresses,
  setDefaultAddress,
  getDefaultAddress,
  restoreAddress,
  softDeleteAddress,
  bulkDeleteAddresses,
  getAllAddressesAdmin,
} from "../controllers/address.controller.js";

import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createAddress);
router.get("/", verifyJWT, getUserAddresses);
router.get("/:id", verifyJWT, getAddressById);
router.get("/default/me", verifyJWT, getDefaultAddress);
router.put("/:id", verifyJWT, updateAddress);
router.delete("/:id", verifyJWT, deleteAddress);
router.patch("/:id/soft-delete", verifyJWT, softDeleteAddress);
router.patch("/:id/restore", verifyJWT, restoreAddress);
router.post("/bulk-delete", verifyJWT, bulkDeleteAddresses);
router.patch("/:id/default", verifyJWT, setDefaultAddress);

router.get("/admin/all", verifyJWT, authorizeRoles, getAllAddressesAdmin);

export default router;
