// controllers/transaction.controller.js
import { Transaction } from "../models/transaction.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const createTransaction = asyncHandler(async (req, res) => {
  const { order, seller, amount, invoiceUrl } = req.body;

  if (!order || !seller || !amount) {
    throw new ApiError(400, "Order, seller, and amount are required");
  }

  const transaction = await Transaction.create({
    order,
    seller,
    amount,
    invoiceUrl,
  });

  return res
    .status(201)
    .json(new ApiResponse(true, "Transaction created successfully", transaction));
});

const getAllTransactions = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20, sort = "-createdAt", status, seller, order } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};
  if (status) filter.status = status;
  if (seller) filter.seller = seller;
  if (order) filter.order = order;

  const transactions = await Transaction.find(filter)
    .populate("seller", "name email")
    .populate("order", "_id createdAt")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments(filter);

  return res.status(200)
  .json(
    new ApiResponse(true, "Transactions fetched successfully", {
      data: transactions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  );
});

const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid transaction ID");

  const transaction = await Transaction.findById(id)
    .populate("seller", "name email")
    .populate("order", "_id createdAt")
    .lean();

  if (!transaction) throw new ApiError(404, "Transaction not found");

  return res.status(200)
  .json(new ApiResponse(true, "Transaction fetched successfully", transaction));
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid transaction ID");

  const updated = await Transaction.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
  if (!updated) throw new ApiError(404, "Transaction not found");

  return res.status(200)
  .json(new ApiResponse(true, "Transaction updated successfully", updated));
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid transaction ID");

  const deleted = await Transaction.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Transaction not found");

  return res.status(200)
  .json(new ApiResponse(true, "Transaction deleted successfully", deleted));
});

const bulkCreateTransactions = asyncHandler(async (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions) || transactions.length === 0)
    throw new ApiError(400, "Transactions array is required");

  const inserted = await Transaction.insertMany(transactions);
  return res.status(201)
  .json(new ApiResponse(true, "Bulk transactions created successfully", inserted));
});

const bulkUpdateTransactions = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) throw new ApiError(400, "Updates array required");

  const results = [];
  for (const u of updates) {
    if (mongoose.Types.ObjectId.isValid(u.id)) {
      const updated = await Transaction.findByIdAndUpdate(u.id, u, { new: true }).lean();
      if (updated) results.push(updated);
    }
  }

  return res.status(200)
  .json(new ApiResponse(true, "Bulk transactions updated successfully", results));
});

const getTransactionsBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(sellerId)) throw new ApiError(400, "Invalid seller ID");

  const transactions = await Transaction.find({ seller: sellerId }).populate("order", "_id createdAt").lean();
  return res.status(200)
  .json(new ApiResponse(true, "Transactions fetched for seller", transactions));
});

const getTransactionAnalytics = asyncHandler(async (req, res) => {
  const result = await Transaction.aggregate([
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = { pending: 0, completed: 0, failed: 0, totalAmount: 0 };
  result.forEach(r => {
    summary[r._id] = r.count;
    summary.totalAmount += r.totalAmount;
  });

  return res.status(200)
  .json(new ApiResponse(true, "Transaction analytics fetched successfully", summary));
});

const filterTransactions = asyncHandler(async (req, res) => {
  const { minAmount, maxAmount } = req.query;
  const filter = {};
  if (minAmount && maxAmount) filter.amount = { $gte: Number(minAmount), $lte: Number(maxAmount) };

  const transactions = await Transaction.find(filter).populate("seller", "name").lean();
  return res.status(200)
  .json(new ApiResponse(true, "Filtered transactions fetched", transactions));
});

export {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  bulkCreateTransactions,
  bulkUpdateTransactions,
  getTransactionsBySeller,
  getTransactionAnalytics,
  filterTransactions,
};
