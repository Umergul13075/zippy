import { Subcategory } from "../models/subcategory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const createSubcategory = asyncHandler(async (req, res) => {
  const { name, slug, category } = req.body;
  if (!name || !slug || !category) {
    throw new ApiError(400, "Name, slug, and category are required");
  }

  const subcategory = await Subcategory.create({ name, slug, category });
  return res.status(201)
  .json(new ApiResponse(true, "Subcategory created successfully", subcategory));
});

const getAllSubcategories = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, sort = "-createdAt", category, search } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: "i" }; // case-insensitive search

  const subcategories = await Subcategory.find(filter)
    .populate("category", "name")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Subcategory.countDocuments(filter);

  return res.status(200)
  .json(new ApiResponse(true, "Subcategories fetched successfully", {
    data: subcategories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }));
});

const getSubcategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid subcategory ID");

  const subcategory = await Subcategory.findById(id).populate("category", "name").lean();
  if (!subcategory) throw new ApiError(404, "Subcategory not found");

  return res.status(200)
  .json(new ApiResponse(true, "Subcategory fetched successfully", subcategory));
});

const updateSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid subcategory ID");

  const subcategory = await Subcategory.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
  if (!subcategory) throw new ApiError(404, "Subcategory not found");

  return res.status(200)
  .json(new ApiResponse(true, "Subcategory updated successfully", subcategory));
});

const softDeleteSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid subcategory ID");

  const deleted = await Subcategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
  if (!deleted) throw new ApiError(404, "Subcategory not found");

  return res.status(200)
  .json(new ApiResponse(true, "Subcategory soft deleted", deleted));
});

const restoreSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid subcategory ID");

  const restored = await Subcategory.findByIdAndUpdate(id, { isDeleted: false }, { new: true }).lean();
  if (!restored) throw new ApiError(404, "Subcategory not found");

  return res.status(200)
  .json(new ApiResponse(true, "Subcategory restored successfully", restored));
});

const deleteSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid subcategory ID");

  const deleted = await Subcategory.findByIdAndDelete(id).lean();
  if (!deleted) throw new ApiError(404, "Subcategory not found");

  return res.status(200)
  .json(new ApiResponse(true, "Subcategory permanently deleted", deleted));
});

const bulkCreateSubcategories = asyncHandler(async (req, res) => {
  const { items } = req.body; 
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "Items array required");

  const inserted = await Subcategory.insertMany(items);
  return res.status(201)
  .json(new ApiResponse(true, "Bulk subcategories created", inserted));
});

const getSubcategoryAnalytics = asyncHandler(async (req, res) => {
  const result = await Subcategory.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $project: { categoryName: "$category.name", count: 1 } }
  ]);

  return res.status(200)
  .json(new ApiResponse(true, "Subcategory analytics fetched", result));
});

export {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategory,
  softDeleteSubcategory,
  restoreSubcategory,
  deleteSubcategory,
  bulkCreateSubcategories,
  getSubcategoryAnalytics
};
