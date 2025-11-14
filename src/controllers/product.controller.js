
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Review } from "../models/review.model.js";
import fs from "fs";
//
// Helper: sanity-check ObjectId
//
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category_id,
    brand,
    stock_quantity,
    warranty,
    is_active = true,
  } = req.body;

  // Validate required fields
if (!name || !description || price == null || !category_id || stock_quantity == null) {
  throw new ApiError(400, "All required fields (name, description, price, category_id, stock_quantity) must be provided");
}

  // Validate numeric fields
  if (isNaN(price) || Number(price) <= 0) {
    throw new ApiError(400, "Price must be a positive number");
  }
  if (isNaN(stock_quantity) || Number(stock_quantity) < 0) {
    throw new ApiError(400, "Stock quantity must be a non-negative number");
  }

  // Validate object IDs
  if (!isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category_id");
  }
  if (brand && !isValidObjectId(brand)) {
    throw new ApiError(400, "Invalid brand id");
  } 
  const imageFile = req.file || (req.files && req.files[0]);
  if (!imageFile) {  
    throw new ApiError(400, "Product image is required");
  }
  if (imageFile) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeMB = 5;

  if (!allowedTypes.includes(imageFile.mimetype)) {
    throw new ApiError(400, "Only JPEG, PNG, or WEBP images are allowed");
  }

  if (imageFile.size > maxSizeMB * 1024 * 1024) {
    throw new ApiError(400, `Image size must be less than ${maxSizeMB} MB`);
  }
}
  let imageUrl;
  try {
    const uploaded = await uploadOnCloudinary(imageFile.path);
    imageUrl = uploaded?.url;
    
    fs.unlinkSync(imageFile.path);
  } catch (err) {
    throw new ApiError(500, "Error uploading product image");
  }
  if (!imageUrl && req.body.image) imageUrl = req.body.image;

  // If you don't use Cloudinary, accept the file path or a pre-uploaded URL:
  // avatarUrl = imageFile.path || req.body.avatar;

  // Fallback: if not using cloudinary, allow an avatar field from body (but we still required some image above)
  // avatarUrl = req.body.avatar || avatarUrl || null;

  const product = await Product.create({
    name,
    description,
    price,
    category_id,
    brand: brand || null,
    stock_quantity,
    warranty: warranty || "",
    image: imageUrl,
    seller: req.user?._id || null,
    is_active,
  });

  const created = await Product.findById(product._id)
    .populate("category_id", "name")
    .populate("brand", "name")
    .populate("seller", "shop_name email");

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Product created successfully"));
});


const getAllProducts = asyncHandler(async (req, res) => {
  
  const {
    page = 1,
    limit = 10,
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    sortOrder = "desc",
    inStockOnly = false,
    isActive = true,
  } = req.query;

  
  const query = {};
  query.is_active = isActive === "false" ? false : true;

  
  if (category && isValidObjectId(category)) {
    query.category_id = category;
  }

  
  if (brand && isValidObjectId(brand)) {
    query.brand = brand;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  
  if (inStockOnly === "true") {
    query.stock_quantity = { $gt: 0 };
  }

  
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.max(Number(limit), 1);
  const skip = (pageNumber - 1) * limitNumber;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };


  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category_id", "name")
      .populate("brand", "name")
      .populate("seller", "shop_name email")
      .skip(skip)
      .limit(limitNumber)
      .sort(sort)
      .lean(),
    Product.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        total,
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        limit: limitNumber,
      },
      "Products fetched successfully"
    )
  );
});


const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id)
    .populate("category_id", "name")
    .populate("brand", "name")
    .populate("seller", "shop_name email");

  if (!product) throw new ApiError(404, "Product not found");

  return res.status(200).json(new ApiResponse(200, product, "Product details fetched successfully"));
});


const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  // Authorization: allow admin or the seller who owns the product
  if (req.user.role !== "admin" && String(product.seller) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this product");
  }

const {
  name,
  description,
  price,
  category_id,
  brand,
  stock_quantity,
  warranty,
  is_active,
} = req.body;

const updatedData = {
  ...(name && { name }),
  ...(description && { description }),
  ...(price && { price }),
  ...(category_id && { category_id }),
  ...(brand && { brand }),
  ...(stock_quantity && { stock_quantity }),
  ...(warranty && { warranty }),
  ...(is_active !== undefined && { is_active }),
};

  // Optional but safe: validate price and stock if provided
  if (price != null && (isNaN(price) || Number(price) <= 0)) {
    throw new ApiError(400, "Price must be a positive number");
  }
  if (stock_quantity != null && (isNaN(stock_quantity) || Number(stock_quantity) < 0)) {
    throw new ApiError(400, "Stock quantity must be a non-negative number");
  }

  // Validate ObjectIds if changed
  if (category_id && !isValidObjectId(category_id)) {
    throw new ApiError(400, "Invalid category_id");
  }
  if (brand && !isValidObjectId(brand)) {
    throw new ApiError(400, "Invalid brand id");
  }


const updated = await Product.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true })
  .populate("category_id", "name")
  .populate("brand", "name")
  .populate("seller", "shop_name email");


  return res.status(200).json(new ApiResponse(200, updated, "Product updated successfully"));
});


const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  if (req.user.role !== "admin" && String(product.seller) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to delete this product");
  }

  product.is_active = false;
  await product.save();

  return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});


const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock_quantity } = req.body;

  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");
  if (stock_quantity == null) throw new ApiError(400, "Stock quantity is required");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  if (req.user.role !== "admin" && String(product.seller) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update stock for this product");
  }

  product.stock_quantity = Number(stock_quantity);
  await product.save();

  return res.status(200).json(new ApiResponse(200, product, "Product stock updated successfully"));
});

const getSellerProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid seller id");

  const products = await Product.find({ seller: id }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, products, "Seller products fetched successfully"));
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  // We assume you will add an `is_featured` boolean or use some business logic. Let's fallback to highest rating.
  const products = await Product.find({ is_active: true, is_featured: true  })
    .sort({ rating: -1, reviews_count: -1 })
    .limit(Number(limit))
    .populate("category_id", "name")
    .populate("brand", "name")
    .lean();

  return res.status(200).json(new ApiResponse(200, products, "Featured products fetched successfully"));
});

const getTopSellingProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ is_active: true })
    .sort({ reviews_count: -1, rating: -1 })
    .limit(Number(limit))
    .populate("brand", "name")
    .lean();

  return res.status(200).json(new ApiResponse(200, products, "Top selling products fetched successfully"));
});

const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;
  if (!q || String(q).trim() === "") {
    throw new ApiError(400, "Search query is required (q)");
  }

  const query = {
    is_active: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ],
  };

  const products = await Product.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("category_id", "name")
    .populate("brand", "name");

  const total = await Product.countDocuments(query);

  return res.status(200).json(new ApiResponse(200, { products, total, page: Number(page), limit: Number(limit) }, "Search results"));
});

const filterProducts = asyncHandler(async (req, res) => {
  // Accepts filters via query params: category, brand, minPrice, maxPrice, rating, inStock
  const { category, brand, minPrice, maxPrice, rating, inStock, page = 1, limit = 12 } = req.query;
  const query = { is_active: true };

  if (category && isValidObjectId(category)) query.category_id = category;
  if (brand && isValidObjectId(brand)) query.brand = brand;
  if (minPrice) query.price = { ...(query.price || {}), $gte: Number(minPrice) };
  if (maxPrice) query.price = { ...(query.price || {}), $lte: Number(maxPrice) };
  if (rating) query.rating = { $gte: Number(rating) };
  if (inStock === "true") query.stock_quantity = { $gt: 0 };

  const products = await Product.find(query)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("category_id", "name")
    .populate("brand", "name");

  const total = await Product.countDocuments(query);

  return res.status(200).json(new ApiResponse(200, { products, total, page: Number(page), limit: Number(limit) }, "Filtered products fetched successfully"));
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  const related = await Product.find({
    _id: { $ne: id },
    category_id: product.category_id,
    is_active: true,
  })
    .limit(10)
    .populate("brand", "name");

  return res.status(200).json(new ApiResponse(200, related, "Related products fetched successfully"));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  if (!isValidObjectId(categoryId)) throw new ApiError(400, "Invalid category id");

  const products = await Product.find({ category_id: categoryId, is_active: true })
    .populate("brand", "name")
    .populate("seller", "shop_name");

  return res.status(200).json(new ApiResponse(200, products, "Products by category fetched successfully"));
});

const getProductsByBrand = asyncHandler(async (req, res) => {
  const { brandId } = req.params;
  if (!isValidObjectId(brandId)) throw new ApiError(400, "Invalid brand id");

  const products = await Product.find({ brand: brandId, is_active: true })
    .populate("category_id", "name")
    .populate("seller", "shop_name");

  return res.status(200).json(new ApiResponse(200, products, "Products by brand fetched successfully"));
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid product id");

  // If you have a Review model, use it. Otherwise return empty
  try {
    const reviews = await Review.find({ product: id }).populate("user", "fullName avatar");
    return res.status(200).json(new ApiResponse(200, reviews, "Product reviews fetched successfully"));
  } catch (err) {
    return res.status(200).json(new ApiResponse(200, [], "Product reviews fetched successfully (no reviews model)"));
  }
});

const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, "Updates array is required");
  }

  const results = [];
  for (const u of updates) {
    const { productId, stock_quantity } = u;
    if (!isValidObjectId(productId) || stock_quantity == null) {
      results.push({ productId, ok: false, reason: "invalid input" });
      continue;
    }
    const product = await Product.findById(productId);
    if (!product) {
      results.push({ productId, ok: false, reason: "not found" });
      continue;
    }
    // permission check: admin or seller owner
    if (req.user.role !== "admin" && String(product.seller) !== String(req.user._id)) {
      results.push({ productId, ok: false, reason: "forbidden" });
      continue;
    }
    product.stock_quantity = Number(stock_quantity);
    await product.save();
    results.push({ productId, ok: true });
  }

  return res.status(200).json(new ApiResponse(200, results, "Bulk stock update completed"));
});


const   sellerGetAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const query = {};
  if (status === "active") query.is_active = true;
  if (status === "inactive") query.is_active = false;
  if (search) query.name = { $regex: search, $options: "i" };

  const products = await Product.find(query)
    .populate("category_id", "name")
    .populate("brand", "name")
    .populate("seller", "shop_name email")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(query);
  return res.status(200).json(new ApiResponse(200, { products, total, page: Number(page), limit: Number(limit) }, "Admin products fetched successfully"));
});

const recommendProducts = asyncHandler(async (req, res) => {
  const recs = await Product.find({ is_active: true }).sort({ rating: -1 }).limit(12);
  return res.status(200).json(new ApiResponse(200, recs, "Recommended products fetched successfully"));
});


export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getSellerProducts,
  getFeaturedProducts,
  getTopSellingProducts,
  searchProducts,
  filterProducts,
  getRelatedProducts,
  getProductsByCategory,
  getProductsByBrand,
  getProductReviews,
  bulkUpdateStock,
  sellerGetAllProducts,
  recommendProducts,
};
