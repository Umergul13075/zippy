import { Brand } from "../models/brand.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const validateBrandInput = (data) => {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
        throw new ApiError(400, "Brand name is required and must be a non-empty string.");
    }
    if (!data.slug || typeof data.slug !== "string" || !data.slug.trim()) {
        throw new ApiError(400, "Brand slug is required and must be a non-empty string.");
    }
    if (!data.logo || typeof data.logo !== "string" || !data.logo.trim()) {
        throw new ApiError(400, "Brand logo is required and must be a valid URL or string.");
    }
};

const createBrand = asyncHandler(async (req, res) => {
    validateBrandInput(req.body);
    const query = { isActive: true };
    console.log("📩 Request received to create brand");
    console.log("Body:", req.body);
    console.log("User:", req.user);

    const { isActive = true } = req.body
    const brand = await Brand.create({
        ...req.body,
        isActive,
        createdBy: req.user._id 
    });
    console.log("✅ Brand created:", brand);
    return res.status(201)
    .json(new ApiResponse(true, "Brand created successfully", brand));
});

const getBrands = asyncHandler(async (req, res) => {
    let { page = 1, limit = 20, sortBy = "createdAt", order = "desc", search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    order = order === "asc" ? 1 : -1;

    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };

    const brands = await Brand.find(query)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await Brand.countDocuments(query);

    return res.status(200).json(new ApiResponse(true, "Brands fetched successfully", {
        data: brands,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }));
});


const getBrandById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid brand ID");

    const brand = await Brand.findById(id).lean();
    if (!brand) throw new ApiError(404, "Brand not found");

    return res.status(200).json(new ApiResponse(true, "Brand fetched successfully", brand));
});


const updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid brand ID");

    validateBrandInput(req.body);

    const brand = await Brand.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!brand) throw new ApiError(404, "Brand not found");

    return res.status(200).json(new ApiResponse(true, "Brand updated successfully", brand));
});


const deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid brand ID");

    const brand = await Brand.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    if (!brand) throw new ApiError(404, "Brand not found");

    return res.status(200).json(new ApiResponse(true, "Brand deactivated successfully", null));
});

const getActiveBrands = asyncHandler(async (req, res) => {
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = { isActive: true };
    const brands = await Brand.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await Brand.countDocuments(query);

    return res.status(200).json(new ApiResponse(true, "Active brands fetched successfully", {
        data: brands,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }));
});

export {
    createBrand,
    updateBrand,
    getBrands,
    getBrandById,
    deleteBrand,
    getActiveBrands,
}