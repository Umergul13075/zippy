import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  if (!productId) throw new ApiError(400, "Product ID is required");

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [productId],
    });
  } else {
    const alreadyExists = wishlist.products.some(
      (p) => p.toString() === productId
    );

    if (alreadyExists)
      throw new ApiError(400, "Product already in wishlist");

    wishlist.products.push(productId);
    await wishlist.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Product added to wishlist"));
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) throw new ApiError(404, "Wishlist not found");

  const index = wishlist.products.findIndex(
    (p) => p.toString() === productId
  );

  if (index === -1)
    throw new ApiError(404, "Product not found in wishlist");

  wishlist.products.splice(index, 1);
  await wishlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Product removed from wishlist"));
});


const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId })
    .populate("products", "name price image stock")
    .lean();

  if (!wishlist || wishlist.products.length === 0)
    throw new ApiError(404, "Wishlist is empty");

  return res
    .status(200)
    .json(new ApiResponse(200, wishlist, "Wishlist fetched successfully"));
});


const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $set: { products: [] } },
    { new: true }
  );

  if (!wishlist) throw new ApiError(404, "Wishlist not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Wishlist cleared successfully"));
});

const checkProductInWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  const wishlist = await Wishlist.findOne({
    user: userId,
    products: productId,
  }).lean();

  const isInWishlist = !!wishlist;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isInWishlist }, "Wishlist status fetched")
    );
});

const getWishlistCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const wishlist = await Wishlist.findOne({ user: userId }).lean();

  const count = wishlist?.products?.length || 0;

  return res
    .status(200)
    .json(new ApiResponse(200, { count }, "Wishlist count fetched"));
});

const getRecommendedFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId })
    .populate("products", "category")
    .lean();

  if (!wishlist || wishlist.products.length === 0)
    throw new ApiError(404, "Wishlist is empty");

  const categories = wishlist.products.map((p) => p.category);
  const uniqueCategories = [...new Set(categories)];

  const recommendations = await Product.find({
    category: { $in: uniqueCategories },
  })
    .limit(5)
    .select("name price image");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { recommendations },
        "Recommended products fetched successfully"
      )
    );
});

const moveToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity = 1 } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) throw new ApiError(404, "Wishlist not found");

  const productIndex = wishlist.products.findIndex(
    (p) => p.toString() === productId
  );
  if (productIndex === -1)
    throw new ApiError(404, "Product not found in wishlist");

  
  wishlist.products.splice(productIndex, 1);
  await wishlist.save();

  
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
  }

 
  return res.status(200).json(
    new ApiResponse(200, { wishlist, cart }, "Product moved to cart successfully")
  );
});

export {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  checkProductInWishlist,
  getWishlistCount,
  getRecommendedFromWishlist,
  moveToCart
};
