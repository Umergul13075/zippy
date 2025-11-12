import { Seller } from "../models/seller.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const createSeller = asyncHandler(async (req, res) => {
  const { name, email, phone_number, password_hash, shop_name, address } = req.body;

  if (!name || !email || !phone_number || !password_hash || !shop_name) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const existingEmail = await Seller.findOne({ email });
  if (existingEmail) throw new ApiError(400, "Email already exists");

  const existingPhone = await Seller.findOne({ phone_number });
  if (existingPhone) throw new ApiError(400, "Phone number already exists");

  const seller = await Seller.create({ name, email, phone_number, password_hash, shop_name, address });
  return res.status(201)
  .json(new ApiResponse(true, "Seller created successfully", seller));
});

const getAllSellers = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, sort = "-createdAt", is_verified, shop_name } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};
  if (is_verified) filter.is_verified = is_verified === "true";
  if (shop_name) filter.shop_name = { $regex: shop_name, $options: "i" };

  const sellers = await Seller.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Seller.countDocuments(filter);

  return res.status(200)
  .json(new ApiResponse(true, "Sellers fetched successfully", {
    data: sellers,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }));
});

const getSellerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid seller ID");

  const seller = await Seller.findById(id).populate("products", "name price").lean();
  if (!seller) throw new ApiError(404, "Seller not found");

  return res.status(200)
  .json(new ApiResponse(true, "Seller fetched successfully", seller));
});

const updateSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid seller ID");

  const updated = await Seller.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
  if (!updated) throw new ApiError(404, "Seller not found");

  return res.status(200)
  .json(new ApiResponse(true, "Seller updated successfully", updated));
});

const softDeleteSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid seller ID");

  const deleted = await Seller.findByIdAndUpdate(id, { is_deleted: true }, { new: true }).lean();
  if (!deleted) throw new ApiError(404, "Seller not found");

  return res.status(200)
  .json(new ApiResponse(true, "Seller soft deleted successfully", deleted));
});

const restoreSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid seller ID");

  const restored = await Seller.findByIdAndUpdate(id, { is_deleted: false }, { new: true }).lean();
  if (!restored) throw new ApiError(404, "Seller not found");

  return res.status(200)
  .json(new ApiResponse(true, "Seller restored successfully", restored));
});

const bulkCreateSellers = asyncHandler(async (req, res) => {
  const { sellers } = req.body;
  if (!Array.isArray(sellers) || sellers.length === 0) throw new ApiError(400, "Sellers array required");

  const inserted = await Seller.insertMany(sellers);
  return res.status(201)
  .json(new ApiResponse(true, "Bulk sellers created successfully", inserted));
});

const getSellerAnalytics = asyncHandler(async (req, res) => {
  const result = await Seller.aggregate([
    {
      $group: {
        _id: "$is_verified",
        count: { $sum: 1 }
      }
    }
  ]);

  const analytics = { verified: 0, unverified: 0 };
  result.forEach(r => {
    if (r._id) analytics.verified = r.count;
    else analytics.unverified = r.count;
  });

  return res.status(200)
  .json(new ApiResponse(true, "Seller analytics fetched successfully", analytics));
});

const getTopSellers = asyncHandler(async (req, res) => {
  const topSellers = await Seller.aggregate([
    { $project: { name: 1, shop_name: 1, productCount: { $size: "$products" } } },
    { $sort: { productCount: -1 } },
    { $limit: 10 }
  ]);

  return res.status(200)
  .json(new ApiResponse(true, "Top sellers fetched successfully", topSellers));
});

const searchSellers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) throw new ApiError(400, "Query is required");

  const sellers = await Seller.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { shop_name: { $regex: query, $options: "i" } }
    ]
  }).limit(50).lean();

  return res.status(200)
  .json(new ApiResponse(true, "Sellers search results fetched", sellers));
});

export {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  softDeleteSeller,
  restoreSeller,
  bulkCreateSellers,
  getSellerAnalytics,
  getTopSellers,
  searchSellers
};
