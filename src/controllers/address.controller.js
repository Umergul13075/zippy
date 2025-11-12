import { Address } from "../models/address.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createAddress = asyncHandler(async (req, res) => {
    const { addressType, street, city, province, country, postalCode, isDefault } = req.body;
    const userId = req.user?._id; 

    if (!userId || !addressType || !street || !city || !province || !country || !postalCode) {
        throw new ApiError(400, "All required address fields must be provided");
    }

    // If setting as default, unset previous default
    if (isDefault) {
        await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    }

    const newAddress = await Address.create({
        user: userId,
        addressType,
        street,
        city,
        province,
        country,
        postalCode,
        isDefault: !!isDefault,
    });

    return res.status(201)
    .json(new ApiResponse(201, newAddress, "Address created successfully"));
});

const getUserAddresses = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
      const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [addresses, total] = await Promise.all([
        Address.find({ user: userId })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
        Address.countDocuments({ user: userId }),
    ]);
    
    if (!addresses.length) {
        throw new ApiError(404, "No addresses found for this user");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            addresses,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        }, "Addresses fetched successfully")
    );
});

const getAddressById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findById(id);
    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    return res.status(200)
    .json(new ApiResponse(200, address, "Address fetched successfully"));
});

const getDefaultAddress = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const defaultAddress = await Address.findOne({ user: userId, isDefault: true });
    if (!defaultAddress) {
        throw new ApiError(404, "No default address found");
    }

    return res.status(200)
    .json(new ApiResponse(200, defaultAddress, "Default address fetched successfully"));
});



const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?._id;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
        throw new ApiError(404, "Address not found or not authorized");
    }

  
    if (updates.isDefault) {
        await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    }

    Object.assign(address, updates);
    await address.save();

    return res.status(200)
    .json(new ApiResponse(200, address, "Address updated successfully"));
});


const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid address ID");
    }

    const deleted = await Address.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
        throw new ApiError(404, "Address not found or not authorized");
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Address deleted successfully"));
});

const softDeleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
        throw new ApiError(404, "Address not found or not authorized");
    }

    address.deletedAt = new Date();
    await address.save();

    return res.status(200).json(new ApiResponse(200, address, "Address soft deleted successfully"));
});

const restoreAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
        throw new ApiError(404, "Address not found or not authorized");
    }

    address.deletedAt = null;
    await address.save();

    return res.status(200)
    .json(new ApiResponse(200, address, "Address restored successfully"));
});

const bulkDeleteAddresses = asyncHandler(async (req, res) => {
    const { addressIds } = req.body;
    if (!addressIds || !Array.isArray(addressIds)) {
        throw new ApiError(400, "addressIds must be an array");
    }

    const deleted = await Address.deleteMany({ _id: { $in: addressIds } });
    Address.deleteMany({ _id: { $in: addressIds }, user: req.user._id });

    return res.status(200)
    .json(new ApiResponse(200, deleted, "Addresses deleted successfully"));
});

const setDefaultAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid address ID");
    }

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
        throw new ApiError(404, "Address not found or not authorized");
    }

    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    address.isDefault = true;
    await address.save();

    return res.status(200)
    .json(new ApiResponse(200, address, "Default address set successfully"));
});

const getAllAddressesAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, sort = "-createdAt" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [addresses, total] = await Promise.all([
        Address.find().populate("user", "name email").sort(sort).skip(skip).limit(parseInt(limit)),
        Address.countDocuments(),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            addresses,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        }, "All addresses fetched successfully")
    );
});

export {
    createAddress,
    updateAddress,
    deleteAddress,
    getAddressById,
    getUserAddresses,
    setDefaultAddress,
    getDefaultAddress,
    restoreAddress,
    softDeleteAddress,
    bulkDeleteAddresses,
    getAllAddressesAdmin
    
}