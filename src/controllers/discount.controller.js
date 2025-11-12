import { Discount } from "../models/discount.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    appliesTo,
    targetEntityId,
    validFrom,
    validTill,
    isActive,
  } = req.body;

  if (!code || !discountType || !discountValue || !validFrom || !validTill) {
    throw new ApiError(400, "Missing required fields");
  }

  const existingCoupon = await Discount.findOne({ code });
  if (existingCoupon) throw new ApiError(400, "Coupon code already exists");

  const coupon = await Discount.create({
    code,
    discountType,
    discountValue,
    appliesTo,
    targetEntityId,
    validFrom,
    validTill,
    isActive,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, coupon, "Coupon created successfully"));
});


const getCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const coupons = await Discount.find()
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Discount.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      coupons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    }, "Coupons fetched successfully")
  );
});


const getCouponById = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Discount.findById(couponId);

  if (!coupon) throw new ApiError(404, "Coupon not found");

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon fetched successfully"));
});


const updateCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Discount.findByIdAndUpdate(couponId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) throw new ApiError(404, "Coupon not found");

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});


const deleteCoupon = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Discount.findById(couponId);

  if (!coupon) throw new ApiError(404, "Coupon not found");

  await coupon.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Coupon deleted successfully"));
});


const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  if (!code) throw new ApiError(400, "Coupon code is required");

  const coupon = await Discount.findOne({ code });

  if (!coupon) throw new ApiError(404, "Coupon not found");
  if (!coupon.isActive) throw new ApiError(400, "Coupon is inactive");
  if (coupon.usedBy.includes(userId)) throw new ApiError(400, "Coupon already used by you");

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validTill) {
    throw new ApiError(400, "Coupon is not valid at this time");
  }

  if (coupon.appliesTo !== "all") {
  if (!req.body.productId && !req.body.categoryId) {
    throw new ApiError(400, "Product or category ID required for this coupon");
  }
  if (coupon.appliesTo === "product" && coupon.targetEntityId.toString() !== req.body.productId) {
        throw new ApiError(400, "Coupon not valid for this product");
    }
    if (coupon.appliesTo === "category" && coupon.      targetEntityId.toString() !== req.body.categoryId) {
        throw new ApiError(400, "Coupon not valid for this category");
    }

}

  // Add user to usedBy
  coupon.usedBy.push(userId);
  await coupon.save();

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon applied successfully"));
});

const toggleCouponStatus = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new ApiError(400, "Invalid coupon ID");
  }

  const coupon = await Discount.findById(couponId);
  if (!coupon) throw new ApiError(404, "Coupon not found");

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`));
});

const getActiveCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Discount.find({
    isActive: true,
    validFrom: { $lte: now },
    validTill: { $gte: now },
  }).sort({ validTill: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Active coupons fetched successfully"));
});

const getUserUsedCoupons = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const coupons = await Discount.find({ usedBy: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, coupons, "User's used coupons fetched successfully"));
});

const searchCoupons = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) throw new ApiError(400, "Search query required");

  const coupons = await Discount.find({
  $or: [
        { code: { $regex: query, $options: "i" } },
        { discountType: { $regex: query, $options: "i" } },
        { appliesTo:  { $regex: `^${query}$`, $options: "i" } }, // exact match
    ],
    }).sort({ createdAt: -1 });


  return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Coupons search result"));
});

const bulkCreateCoupons = asyncHandler(async (req, res) => {
  const { coupons } = req.body; // expects array of coupon objects

  if (!coupons || !Array.isArray(coupons)) {
    throw new ApiError(400, "Coupons array is required");
  }

  for (let c of coupons) {
    if (!c.code || !c.discountType || !c.discountValue || !c.validFrom || !c.validTill) {
    throw new ApiError(400, "All coupons must have required fields");
  }
    }
    const createdCoupons = await Discount.insertMany(coupons);


  return res
    .status(201)
    .json(new ApiResponse(201, createdCoupons, "Bulk coupons created successfully"));
});

const getExpiredCoupons = asyncHandler(async (req, res) => {
    const now = new Date();
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const coupons = await Discount.find({ validTill: { $lt: now } })
    .sort({ validTill: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Discount.countDocuments({ validTill: { $lt: now } });

    return res.status(200).json(
    new ApiResponse(200, {
        coupons,
        pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    }
  }, "Expired coupons fetched successfully"));
});

const removeUserFromCoupon = asyncHandler(async (req, res) => {
  const { couponId, userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(couponId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid coupon or user ID");
  }

  const coupon = await Discount.findById(couponId);
  if (!coupon) throw new ApiError(404, "Coupon not found");

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can remove users from coupons");
    }
    coupon.usedBy.pull(userId);
    await coupon.save();


  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "User removed from coupon successfully"));
});

const getCouponStats = asyncHandler(async (req, res) => {
  const totalCoupons = await Discount.countDocuments();
  const totalUsed = await Discount.aggregate([
    { $project: { usedCount: { $size: "$usedBy" } } },
    { $group: { _id: null, totalUsed: { $sum: "$usedCount" } } }
  ]);

  return res.status(200).json(
    new ApiResponse(200, { totalCoupons, totalUsed: totalUsed[0]?.totalUsed || 0 }, "Coupon stats fetched successfully")
  );
});


export {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  toggleCouponStatus,
  getActiveCoupons,
  searchCoupons,
  getUserUsedCoupons,
  bulkCreateCoupons,
  getCouponStats,
  removeUserFromCoupon,
  getExpiredCoupons
};
