import { Shipping } from "../models/shipping.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";


const createShipping = asyncHandler(async (req, res) => {
  const { order, address, trackingId, carrier, estimatedDelivery } = req.body;
  if (!order || !address) throw new ApiError(400, "Order and Address are required");

  const shipping = await Shipping.create({ order, address, trackingId, carrier, estimatedDelivery });
  return res.status(201)
  .json(new ApiResponse(true, "Shipping record created successfully", shipping));
});

const getAllShippings = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, sort = "-createdAt", status, carrier } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};
  if (status) filter.status = status;
  if (carrier) filter.carrier = carrier;

  const shippings = await Shipping.find(filter)
    .populate("order", "_id user totalAmount")
    .populate("address", "street city province country postalCode")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Shipping.countDocuments(filter);

  return res.status(200).json(new ApiResponse(true, "Shipping records fetched successfully", {
    data: shippings,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }));
});

const getShippingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid shipping ID");

  const shipping = await Shipping.findById(id)
    .populate("order", "_id user totalAmount")
    .populate("address", "street city province country postalCode")
    .lean();

  if (!shipping) throw new ApiError(404, "Shipping record not found");
  return res.status(200)
  .json(new ApiResponse(true, "Shipping record fetched successfully", shipping));
});

const updateShipping = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid shipping ID");

  const updated = await Shipping.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
  if (!updated) throw new ApiError(404, "Shipping record not found");

  return res.status(200)
  .json(new ApiResponse(true, "Shipping record updated successfully", updated));
});

const softDeleteShipping = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid shipping ID");

  const deleted = await Shipping.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!deleted) throw new ApiError(404, "Shipping record not found");

  return res.status(200)
  .json(new ApiResponse(true, "Shipping record soft deleted successfully", deleted));
});

const restoreShipping = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid shipping ID");

  const restored = await Shipping.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
  if (!restored) throw new ApiError(404, "Shipping record not found");

  return res.status(200)
  .json(new ApiResponse(true, "Shipping record restored successfully", restored));
});

const deleteShipping = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid shipping ID");

  const deleted = await Shipping.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Shipping record not found");

  return res.status(200)
  .json(new ApiResponse(true, "Shipping record permanently deleted", deleted));
});

const getShippingAnalytics = asyncHandler(async (req, res) => {
  const result = await Shipping.aggregate([
    { $group: {
        _id: "$status",
        count: { $sum: 1 }
    }}
  ]);

  const summary = { processing: 0, in_transit: 0, delivered: 0, cancelled: 0 };
  result.forEach(r => summary[r._id] = r.count);

  return res.status(200)
  .json(new ApiResponse(true, "Shipping analytics fetched successfully", summary));
});

const bulkUpdateShippingStatus = asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{id, status, deliveredAt}, ...]
  if (!Array.isArray(updates) || updates.length === 0) throw new ApiError(400, "Updates array required");

  const results = [];
  for (const u of updates) {
    if (mongoose.Types.ObjectId.isValid(u.id)) {
      const updated = await Shipping.findByIdAndUpdate(u.id, {
        status: u.status,
        deliveredAt: u.deliveredAt || null
      }, { new: true });
      if (updated) results.push(updated);
    }
  }

  return res.status(200)
  .json(new ApiResponse(true, "Bulk shipping status updated", results));
});

const getShippingByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new ApiError(400, "Invalid order ID");

  const shippings = await Shipping.find({ order: orderId })
    .populate("address", "street city province country postalCode")
    .lean();

  return res.status(200)
  .json(new ApiResponse(true, "Shippings fetched for order successfully", shippings));
});

export {
  createShipping,
  getAllShippings,
  getShippingById,
  updateShipping,
  softDeleteShipping,
  restoreShipping,
  deleteShipping,
  getShippingAnalytics,
  bulkUpdateShippingStatus,
  getShippingByOrderId
};
