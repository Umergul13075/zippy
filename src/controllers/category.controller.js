import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, parentCategory, displayOrder, isActive } = req.body;

  if (!name?.trim() || !slug?.trim()) {
    throw new ApiError(400, "Name and slug are required");
  }

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
  throw new ApiError(400, "Slug must contain only lowercase letters, numbers, and hyphens");
    }

  const existingCategory = await Category.findOne({ $or: [{ name }, { slug }] });
  if (existingCategory) {
    throw new ApiError(409, "Category name or slug already exists");
  }

  let iconUrl = "";
  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult?.secure_url) {
      throw new ApiError(400, "Error uploading icon to Cloudinary");
    }
    iconUrl = uploadResult.secure_url;
  }

  const category = await Category.create({
    name,
    slug,
    parentCategory: parentCategory || null,
    iconUrl,
    displayOrder: displayOrder || 0,
    isActive: isActive ?? true,
  });
  await category.populate("parentCategory", "name slug");
  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate("parentCategory", "name slug")
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  if (!categories || categories.length === 0) {
    throw new ApiError(404, "No categories found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { total: categories.length, categories }, "Categories fetched successfully")
    );
});

const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id)
  .populate("parentCategory", "name slug")
  .lean();

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});


const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, parentCategory, displayOrder, isActive } = req.body;

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
  throw new ApiError(400, "Slug must contain only lowercase letters, numbers, and hyphens");
}
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Upload new icon if provided
  if (req.file) {
    if (category.iconUrl) {
      const publicId = category.iconUrl.split("/").pop().split(".")[0];
      await deleteFromCloudinary(publicId);
    }

    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult?.secure_url) {
      throw new ApiError(400, "Error uploading icon to Cloudinary");
    }
    category.iconUrl = uploadResult.secure_url;
  }

  category.name = name?.trim() || category.name;
  category.slug = slug?.trim() || category.slug;
  category.parentCategory = parentCategory || category.parentCategory;
  category.displayOrder = displayOrder ?? category.displayOrder;
  category.isActive = isActive ?? category.isActive;

  const updatedCategory = await category.save();
  await updatedCategory.populate("parentCategory", "name slug");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCategory, "Category updated successfully"));
});


const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (category.iconUrl) {
    const publicId = category.iconUrl.split("/").pop().split(".")[0];
    await deleteFromCloudinary(publicId);
  }

  await category.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

const getActiveCategories = asyncHandler(async (req, res) => {
  const activeCategories = await Category.find({ isActive: true })
    .populate("parentCategory", "name slug")
    .sort({ displayOrder: 1 })
    .lean();

  if (!activeCategories || activeCategories.length === 0) {
    throw new ApiError(404, "No active categories found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, activeCategories, "Active categories fetched successfully")
    );
});


const searchCategoriesByName = asyncHandler(async (req, res) => {
  const { keyword } = req.query;

  if (!keyword || !keyword.trim()) {
    throw new ApiError(400, "Search keyword is required");
  }

  const regex = new RegExp(keyword.trim(), "i");
  const categories = await Category.find({ name: regex })
    .populate("parentCategory", "name slug")
    .sort({ displayOrder: 1 })
    .lean();

  if (!categories || categories.length === 0) {
    throw new ApiError(404, "No matching categories found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, categories, `Categories matching '${keyword}' fetched successfully`)
    );
});

const getSubCategories = asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  const subCategories = await Category.find({ parentCategory: parentId })
    .populate("parentCategory", "name slug")
    .lean();

  if (!subCategories.length) {
    throw new ApiError(404, "No subcategories found for this parent");
  }

  return res.status(200).json(
    new ApiResponse(200, subCategories, "Subcategories fetched successfully")
  );
});


export{
    createCategory,
    getCategoryById,
    updateCategory,
    getAllCategories,
    deleteCategory,
    getActiveCategories,
    searchCategoriesByName,
    getSubCategories
}