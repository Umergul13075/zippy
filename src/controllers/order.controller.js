import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import mongoose from "mongoose";

const createOrder = asyncHandler(async (req, res) => {
  const { user, seller, items, payment, shipping, coupon, totalAmount } = req.body;

  if (!user || !seller || !items?.length || !totalAmount) {
    throw new ApiError(400, "User, seller, items, and totalAmount are required");
  }

  const order = await Order.create({
    user,
    seller,
    items,
    payment: payment || null,
    shipping: shipping || null,
    coupon: coupon || null,
    totalAmount,
  });

  await order.populate([
    { path: "user", select: "name email" },
    { path: "seller", select: "name email" },
    { path: "items", select: "product quantity price" },
    { path: "payment", select: "method status amount" },
    { path: "shipping", select: "address city postalCode status" },
    { path: "coupon", select: "code discount" },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});


const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
  throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findById(id)
    .populate([
      { path: "user", select: "name email" },
      { path: "seller", select: "name email" },
      { path: "items", select: "product quantity price" },
      { path: "payment", select: "method status amount" },
      { path: "shipping", select: "address city postalCode status" },
      { path: "coupon", select: "code discount" },
    ])
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});


const getAllOrders = asyncHandler(async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find()
    .populate("user", "name email")
    .populate("seller", "name email")
    .sort({ createdAt: -1 })
    .lean()
    .skip(skip)
    .limit(limit);

  if (!orders.length) {
    throw new ApiError(404, "No orders found");
  }
  const totalOrders = await Order.countDocuments(); 
  return res.status(200).json(
  new ApiResponse(200, {
    totalOrders,
    currentPage: page,
    totalFetched: orders.length,
    orders,
  }, "Orders fetched successfully")
);

});


const getUserOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: userId })
    .populate("seller", "name email")
    .populate("items", "product quantity price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!orders.length) {
    throw new ApiError(404, "No orders found for this user");
  }

 const totalOrders = await Order.countDocuments({ user: userId });
 return res.status(200).json(
  new ApiResponse(200, {
    totalOrders,
    currentPage: page,
    totalFetched: orders.length,
    orders,
  }, "User orders fetched successfully")
);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
  throw new ApiError(400, "Invalid order ID");
  }

  if (!status) {
    throw new ApiError(400, "Order status is required");
  }

  const allowedStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;
  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, "Order status updated successfully"));
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  await order.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Order deleted successfully"));
});

const getOrdersByStatus = asyncHandler(async (req, res) => {
  const { status } = req.query;

  if (!status) {
    throw new ApiError(400, "Status query is required");
  }

  const orders = await Order.find({ status })
    .populate("user", "name email")
    .populate("seller", "name email")
    .sort({ createdAt: -1 })
    .lean();

  if (!orders.length) {
    throw new ApiError(404, `No orders found with status '${status}'`);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { total: orders.length, orders }, "Orders fetched by status successfully")
    );
});

const getSellerOrders = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ seller: sellerId })
    .populate("user", "name email")
    .populate("items", "product quantity price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!orders.length) {
    throw new ApiError(404, "No orders found for this seller");
  }

 const totalOrders = await Order.countDocuments({ seller: sellerId });
 return res.status(200).json(
  new ApiResponse(200, {
    totalOrders,
    currentPage: page,
    totalFetched: orders.length,
    orders,
  }, "Seller orders fetched successfully")
);

});

const getRecentOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "name email")
    .populate("seller", "name email")
    .lean();

  const totalOrders = await Order.countDocuments();
  return res.status(200).json(
  new ApiResponse(200, {
    totalOrders,
    currentPage: page,
    totalFetched: recentOrders.length,
    recentOrders,
  }, "Recent orders fetched successfully"));
});

const getTotalSales = asyncHandler(async (req, res) => {
  const result = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
  ]);

  const totalSales = result[0]?.totalSales || 0;

  return res
    .status(200)
    .json(new ApiResponse(200, { totalSales }, "Total sales calculated successfully"));
});

const getOrdersStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Order statistics fetched successfully"));
});

const getOrdersInDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required");
  }

  if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
  throw new ApiError(400, "Invalid date format for startDate or endDate");
  }

  const orders = await Order.find({
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  })
    .populate("user", "name email")
    .populate("seller", "name email")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, { total: orders.length, orders }, "Orders fetched for given date range"));
});

export {
  createOrder,
  getOrderById,
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  deleteOrder,
  getOrdersByStatus,
  getSellerOrders,
  getRecentOrders,
  getTotalSales,
  getOrdersStats,
  getOrdersInDateRange
};
