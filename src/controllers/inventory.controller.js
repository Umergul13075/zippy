import { Inventory } from "../models/inventory.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const createInventory = asyncHandler(async (req, res) => {
  const { varient, seller, quantity } = req.body;

  if (!varient || !seller || quantity == null) {
    throw new ApiError(400, "varient, seller, and quantity are required");
  }

  const inventory = await Inventory.create({ varient, seller, quantity });
  return res.status(201).json(new ApiResponse(201, inventory, "Inventory created successfully"));
});

const getInventories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const inventories = await Inventory.find()
    .populate("varient")
    .populate("seller")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ lastUpdated: -1 });

  const total = await Inventory.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      inventories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    }, "Inventories fetched successfully")
  );
});


const getInventoryById = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new ApiError(400, "Invalid inventory ID");
  }

  const inventory = await Inventory.findById(inventoryId)
    .populate("varient")
    .populate("seller");

  if (!inventory) throw new ApiError(404, "Inventory not found");

  return res.status(200).json(new ApiResponse(200, inventory, "Inventory fetched successfully"));
});


const updateInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new ApiError(400, "Invalid inventory ID");
  }

  const inventory = await Inventory.findByIdAndUpdate(
    inventoryId,
    { ...req.body, lastUpdated: Date.now() },
    { new: true, runValidators: true }
  );

  if (!inventory) throw new ApiError(404, "Inventory not found");

  return res.status(200).json(new ApiResponse(200, inventory, "Inventory updated successfully"));
});


const deleteInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new ApiError(400, "Invalid inventory ID");
  }

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new ApiError(404, "Inventory not found");

  await inventory.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Inventory deleted successfully"));
});


const adjustInventoryQuantity = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  const { quantityChange } = req.body; // positive or negative number

  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new ApiError(400, "Invalid inventory ID");
  }

  if (quantityChange == null) {
    throw new ApiError(400, "quantityChange is required");
  }

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new ApiError(404, "Inventory not found");

  const newQuantity = inventory.quantity + quantityChange;
  if (newQuantity < 0) {
    throw new ApiError(400, "Quantity cannot be negative");
  }

  inventory.quantity = newQuantity;
  inventory.lastUpdated = Date.now();
  await inventory.save();

  return res.status(200).json(new ApiResponse(200, inventory, "Inventory quantity updated successfully"));
});


const getInventoryBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const inventories = await Inventory.find({ seller: sellerId })
    .populate("varient")
    .sort({ lastUpdated: -1 });

  return res.status(200).json(new ApiResponse(200, inventories, "Seller inventories fetched successfully"));
});


const searchInventory = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) throw new ApiError(400, "Search query is required");

  const inventories = await Inventory.find()
    .populate({
      path: "varient",
      match: { name: { $regex: query, $options: "i" } }
    })
    .populate("seller");

  const filtered = inventories.filter(i => i.varient); // remove nulls

  return res.status(200).json(new ApiResponse(200, filtered, "Inventory search results"));
});

const getLowStockInventories = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5;

  const inventories = await Inventory.find({ quantity: { $lte: threshold } })
    .populate("varient")
    .populate("seller")
    .sort({ quantity: 1 });

  return res.status(200).json(new ApiResponse(200, inventories, "Low-stock inventories fetched successfully"));
});

const bulkUpdateInventory = asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{ inventoryId, quantityChange }]

  if (!updates || !Array.isArray(updates)) {
    throw new ApiError(400, "Updates array is required");
  }

  const updatedInventories = [];

  for (let u of updates) {
    if (!u.inventoryId || u.quantityChange == null) {
      throw new ApiError(400, "Each update must have inventoryId and quantityChange");
    }

    if (!mongoose.Types.ObjectId.isValid(u.inventoryId)) {
      throw new ApiError(400, "Invalid inventory ID");
    }

    const inventory = await Inventory.findById(u.inventoryId);
    if (!inventory) continue;

    const newQuantity = inventory.quantity + u.quantityChange;
    if (newQuantity < 0) continue;

    inventory.quantity = newQuantity;
    inventory.lastUpdated = Date.now();
    await inventory.save();

    updatedInventories.push(inventory);
  }

  return res.status(200).json(new ApiResponse(200, updatedInventories, "Bulk inventory updated successfully"));
});

const getInventoryStats = asyncHandler(async (req, res) => {
  const totalItems = await Inventory.countDocuments();
  const totalQuantityResult = await Inventory.aggregate([
    { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
  ]);

  const totalQuantity = totalQuantityResult[0]?.totalQuantity || 0;

  return res.status(200).json(new ApiResponse(200, { totalItems, totalQuantity }, "Inventory stats fetched successfully"));
});

const getInventoryByVariant = asyncHandler(async (req, res) => {
  const { variantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(variantId)) {
    throw new ApiError(400, "Invalid variant ID");
  }

  const inventories = await Inventory.find({ varient: variantId })
    .populate("seller")
    .sort({ lastUpdated: -1 });

  return res.status(200).json(new ApiResponse(200, inventories, "Inventories by variant fetched successfully"));
});

const clearInventory = asyncHandler(async (req, res) => {
  const { sellerId, variantId } = req.body;

  if (!sellerId && !variantId) {
    throw new ApiError(400, "Provide sellerId or variantId to clear inventory");
  }

  let filter = {};
  if (sellerId) {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) throw new ApiError(400, "Invalid seller ID");
    filter.seller = sellerId;
  }
  if (variantId) {
    if (!mongoose.Types.ObjectId.isValid(variantId)) throw new ApiError(400, "Invalid variant ID");
    filter.varient = variantId;
  }

  const result = await Inventory.deleteMany(filter);

  return res.status(200).json(new ApiResponse(200, result, "Inventory cleared successfully"));
});


export {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  adjustInventoryQuantity,
  getInventoryBySeller,
  searchInventory,
  getLowStockInventories,
  bulkUpdateInventory,
  getInventoryStats,
  getInventoryByVariant,
  clearInventory
};
