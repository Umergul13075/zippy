import { OrderItem } from "../models/orderItem.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";


const createOrderItem = asyncHandler(async (req, res) => {
    const { order, product, quantity, price } = req.body;

    if (!product || !quantity || !price) {
        throw new ApiError(400, "Product, quantity, and price are required");
    }

    const subtotal = quantity * price;

    const orderItem = await OrderItem.create({
        order,
        product,
        quantity,
        price,
        subtotal,
    });

    return res
        .status(201)
        .json(new ApiResponse(true, "Order item created successfully", orderItem));
});


const getAllOrderItems = asyncHandler(async (req, res) => {
    let { page = 1, limit = 20, sort = "-createdAt", product, order } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};
    if (product) filter.product = product;
    if (order) filter.order = order;
    if (req.query.minPrice && req.query.maxPrice) {
        filter.price = { $gte: req.query.minPrice, $lte: req.query.maxPrice };
    }

    const orderItems = await OrderItem.find(filter)
        .populate("product", "name price")
        .populate("order", "_id createdAt")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await OrderItem.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(true, "Order items fetched successfully", {
            data: orderItems,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    );
});


const getOrderItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Invalid order item ID");

    const orderItem = await OrderItem.findById(id)
        .populate("product", "name price")
        .populate("order", "_id createdAt")
        .lean();

    if (!orderItem) throw new ApiError(404, "Order item not found");

    return res
        .status(200)
        .json(new ApiResponse(true, "Order item fetched successfully", orderItem));
});

const updateOrderItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Invalid order item ID");

    const existing = await OrderItem.findById(id);
    if (!existing) throw new ApiError(404, "Order item not found");

    const { quantity, price } = req.body;
    req.body.subtotal = (quantity || existing.quantity) * (price || existing.price);

    const updatedOrderItem = await OrderItem.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    }).lean();

    return res
        .status(200)
        .json(new ApiResponse(true, "Order item updated successfully", updatedOrderItem));
});


const softDeleteOrderItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Invalid order item ID");

    const deleted = await OrderItem.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
    );

    if (!deleted) throw new ApiError(404, "Order item not found");

    return res
        .status(200)
        .json(new ApiResponse(true, "Order item soft deleted successfully", deleted));
});


const restoreOrderItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const restored = await OrderItem.findByIdAndUpdate(
        id,
        { isDeleted: false },
        { new: true }
    );

    if (!restored) throw new ApiError(404, "Order item not found");

    return res
        .status(200)
        .json(new ApiResponse(true, "Order item restored successfully", restored));
});


const deleteOrderItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
        throw new ApiError(400, "Invalid order item ID");

    const deletedOrderItem = await OrderItem.findByIdAndDelete(id);

    if (!deletedOrderItem) throw new ApiError(404, "Order item not found");

    return res
        .status(200)
        .json(new ApiResponse(true, "Order item permanently deleted", deletedOrderItem));
});


const getItemsByOrderId = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId))
        throw new ApiError(400, "Invalid order ID");

    const items = await OrderItem.find({ order: orderId })
        .populate("product", "name price")
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(true, "Order items fetched for this order", items));
});

const getOrderItemsAnalytics = asyncHandler(async (req, res) => {
    const result = await OrderItem.aggregate([
        {
            $group: {
                _id: null,
                totalQuantitySold: { $sum: "$quantity" },
                totalRevenue: { $sum: "$subtotal" },
                avgItemPrice: { $avg: "$price" },
            },
        },
    ]);

    const analytics = result[0] || {
        totalQuantitySold: 0,
        totalRevenue: 0,
        avgItemPrice: 0,
    };

    return res
        .status(200)
        .json(new ApiResponse(true, "Order item analytics fetched successfully", analytics));
});


const bulkCreateOrderItems = asyncHandler(async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, "Items array is required");
    }

    const preparedItems = items.map((item) => ({
        ...item,
        subtotal: item.quantity * item.price,
    }));

    const inserted = await OrderItem.insertMany(preparedItems);

    return res
        .status(201)
        .json(new ApiResponse(true, "Bulk order items created successfully", inserted));
});

const getLowStockOrHighValueItems = asyncHandler(async (req, res) => {
  const { type } = req.query;

  let filter = {};
  if (type === "low-stock") filter.quantity = { $lte: 2 };
  if (type === "high-value") filter.subtotal = { $gte: 10000 };

  const items = await OrderItem.find(filter)
    .populate("product", "name price")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(true, `Filtered order items (${type}) fetched`, items));
});

const getMonthlySalesReport = asyncHandler(async (req, res) => {
  const report = await OrderItem.aggregate([
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalRevenue: { $sum: "$subtotal" },
        totalQuantity: { $sum: "$quantity" },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(true, "Monthly sales report generated", report));
});

const bulkUpdateOrderItems = asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{id, fieldsToUpdate}, ...]
  if (!Array.isArray(updates) || updates.length === 0)
    throw new ApiError(400, "Updates array required");

  const results = [];
  for (const u of updates) {
    if (mongoose.Types.ObjectId.isValid(u.id)) {
      const updated = await OrderItem.findByIdAndUpdate(u.id, u, { new: true });
      if (updated) results.push(updated);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(true, "Bulk order items updated", results));
});

export {
    createOrderItem,
    updateOrderItem,
    deleteOrderItem,
    bulkCreateOrderItems,
    getAllOrderItems,
    getItemsByOrderId,
    getOrderItemById,
    softDeleteOrderItem,
    restoreOrderItem,
    getOrderItemsAnalytics,
    getLowStockOrHighValueItems,
    bulkUpdateOrderItems,
    getMonthlySalesReport
}
