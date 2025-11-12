import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js"; // use Product model instead
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  if (!productId || !quantity)
    throw new ApiError(400, "Product ID and quantity are required");

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  if (quantity < 1)
    throw new ApiError(400, "Quantity must be at least 1");

  const product = await Product.findById(productId).lean();
  if (!product) throw new ApiError(404, "Product not found");

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart successfully"));
});

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product", "name price image stock")
    .lean();

  if (!cart || cart.items.length === 0)
    throw new ApiError(404, "Your cart is empty");

  // Calculate total price
  const totalPrice = cart.items.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { ...cart, totalPrice }, "Cart fetched successfully")
    );
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  if (!productId || quantity === undefined)
    throw new ApiError(400, "Product ID and quantity are required");

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  let cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) throw new ApiError(404, "Item not found in cart");

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart updated successfully"));
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) throw new ApiError(404, "Item not found in cart");

  cart.items.splice(itemIndex, 1);
  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart"));
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $set: { items: [] } },
    { new: true }
  );

  if (!cart) throw new ApiError(404, "Cart not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Cart cleared successfully"));
});

const getCartItemCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || !cart.items.length)
    throw new ApiError(404, "Cart is empty");

  const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return res
    .status(200)
    .json(new ApiResponse(200, { totalItems }, "Cart item count fetched successfully"));
});

const checkProductInCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ApiError(400, "Invalid product ID");

  const cart = await Cart.findOne({
    user: userId,
    "items.product": productId,
  }).lean();

  const isInCart = !!cart;

  return res
    .status(200)
    .json(new ApiResponse(200, { isInCart }, "Product cart status fetched"));
});

const mergeGuestCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { guestItems } = req.body; // Array of { productId, quantity }

  if (!Array.isArray(guestItems) || guestItems.length === 0)
    throw new ApiError(400, "Guest cart is empty or invalid");

  for (const item of guestItems) {
    if (!item.productId) {
      throw new ApiError(400, "Each item must have a productId");
    }
    if (!item.quantity || item.quantity < 1) {
      throw new ApiError(400, "Each item must have a valid quantity (min 1)");
    }
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new ApiError(400, `Invalid productId: ${item.productId}`);
    }
  }
  
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: guestItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      })),
    });
  } else {
    for (const item of guestItems) {
      const existing = cart.items.find(
        (i) => i.product.toString() === item.productId
      );

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.items.push({ product: item.productId, quantity: item.quantity });
      }
    }
    await cart.save();
  }
  

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Guest cart merged successfully"));
});

const getCartSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product", "price name")
    .lean();

  if (!cart || !cart.items.length)
    throw new ApiError(404, "Cart is empty");

  const subtotal = cart.items.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const estimatedShipping = subtotal > 1000 ? 0 : 150;
  const total = subtotal + estimatedShipping;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subtotal, estimatedShipping, total },
        "Cart summary fetched successfully"
      )
    );
});


export {
    addToCart,
    removeCartItem,
    updateCartItem,
    getCart,
    clearCart,
    getCartItemCount,
    checkProductInCart,
    mergeGuestCart,
    getCartSummary    

}