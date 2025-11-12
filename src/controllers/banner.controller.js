import { Banner } from "../models/banner.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const validateBannerInput = (data) => {
    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
        throw new ApiError(400, "Title is required and must be a non-empty string.");
    }
    if (!data.targetUrl || typeof data.targetUrl !== "string" || !data.targetUrl.trim()) {
        throw new ApiError(400, "targetUrl is required and must be a valid string.");
    }
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        throw new ApiError(400, "The banner start date cannot be later than its end date.");
    }
};


export const createBanner = asyncHandler(async (req, res) => {
    validateBannerInput(req.body);
    const banner = await Banner.create(req.body);
    return res.status(201)
    .json(new ApiResponse(true, "Banner created successfully", banner));
});


const getBanners = asyncHandler(async (req, res) => {
    let { page = 1, limit = 20, sortBy = "displayOrder", order = "asc" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    order = order === "asc" ? 1 : -1;

    const banners = await Banner.find({ isAactive: true })
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(); // lean for performance on large datasets

    const total = await Banner.countDocuments({ isAactive: true });

    return res.status(200).json(new ApiResponse(true, "Banners fetched successfully", {
        data: banners,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }));
});


const getBannerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid banner ID");
    }

    const banner = await Banner.findById(id).lean();

    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }

    return res.status(200)
    .json(new ApiResponse(true, "Banner fetched successfully", banner));
});


const updateBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid banner ID");
    }

     validateBannerInput(req.body);

    const banner = await Banner.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    })
    .lean();

    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }

    return res.status(200)
    .json(new ApiResponse(true, "Banner updated successfully", banner));
});


const deleteBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid banner ID");
    }

    const banner = await Banner.findByIdAndUpdate(id, { isAactive: false }, { new: true })
    .lean();
    
    if (!banner) throw new ApiError(404, "Banner not found");

    return res.status(200).json(new ApiResponse(true, "Banner deactivated successfully", null));
});

// for frontend only
const getActiveBanners = asyncHandler(async (req, res) => {
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const today = new Date();
    const query = {
        isAactive: true,
        startDate: { $lte: today },
        $or: [{ endDate: { $gte: today } }, { endDate: null }]
    };

    const banners = await Banner.find(query)
        .sort({ displayOrder: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await Banner.countDocuments(query);

    return res.status(200)
    .json(new ApiResponse(true, "Active banners fetched successfully", {
        data: banners,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    }));
});

 const bulkUpdateDisplayOrder = asyncHandler(async (req, res) => {
    const updates = req.body; // [{ id, displayOrder }, ...]
    if (!Array.isArray(updates)) throw new ApiError(400, "Request body must be an array of updates.");

    const bulkOps = updates.map(u => ({
        updateOne: {
            filter: { _id: u.id },
            update: { displayOrder: u.displayOrder }
        }
    }));

    await Banner.bulkWrite(bulkOps);
    return res.status(200)
    .json(new ApiResponse(true, "Banner display order updated successfully", null));
});

export {
    createBanner,
    updateBanner,
    getBannerById,
    deleteBanner,
    getBanners,
    getActiveBanners,
    bulkUpdateDisplayOrder
}