import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Review } from "../models/review.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";


const createReview = asyncHandler(async (req, res) => {
    const { product, rating } = req.body;

    if (!product || !rating) {
    throw new ApiError(400, "Product and rating are required");
    }

    if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const existingReview = await Review.findOne({ user: req.user._id, product });
    
    if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
    }


    const review = await Review.create({
    user: req.user._id,
    product,
    rating,
    });

    return res
    .status(201)
    .json(new ApiResponse(201, review, "Review created successfully"));

    
});


const getAllReviews = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
    .populate("user", "name email")
    .populate("product", "name price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    if (!reviews.length) {
   return res
        .status(200)
        .json(new ApiResponse(200, [], "No reviews found yet"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, reviews, "All reviews fetched successfully"));
    });


const getReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
    }

    const review = await Review.findById(id)
    .populate("user", "name email")
    .populate("product", "name price")
    .lean();

    if (!review) {
    throw new ApiError(404, "Review not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, review, "Review fetched successfully"));
});

const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
    const review = await Review.findById(id).session(session);

    
    if (!review) {
    throw new ApiError(404, "Review not found");
    }

    // Only owner or admin can delete
    if (
    review.user.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
    ) {
    throw new ApiError(403, "Not authorized to delete this review");
    }

    await Comment.deleteMany({ review: id }).session(session);
    await review.deleteOne({ session });

    await session.commitTransaction();
    

    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Review and its comments deleted successfully")
    );
    

    } catch (err) {
    await session.abortTransaction();
    throw err;
    }finally{
        session.endSession();
    }
});


const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  if (rating && (rating < 1 || rating > 5)) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");

  if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    throw new ApiError(403, "Not authorized to update this review");
  }

  review.rating = rating || review.rating;
  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});


const getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const reviews = await Review.find({ product: productId })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  if (!reviews.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No reviews found for this product"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, "Product reviews fetched successfully"));
});



const toggleReviewLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");

  const userId = req.user._id;
  const alreadyLiked = review.likes?.includes(userId);

  if (alreadyLiked) {
    review.likes.pull(userId);
  } else {
    review.likes.push(userId);
  }

  await review.save();
  return res
    .status(200)
    .json(new ApiResponse(200, review, alreadyLiked ? "Review unliked" : "Review liked"));
});

const getAverageRatingForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const result = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: "$product", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
  ]);

  if (!result.length) {
    return res.status(200)
    .json(new ApiResponse(200,
         { averageRating: 0, totalReviews: 0 }, 
         "No reviews found"
        ));
  }

  return res.status(200)
  .json(new ApiResponse(200, result[0], "Average rating fetched successfully"));
});

const getReviewsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user ID");

  const reviews = await Review.find({ user: userId })
    .populate("product", "name price")
    .sort({ createdAt: -1 })
    .lean();

  if (!reviews.length)
    return res.status(200)
    .json(new ApiResponse(200, [], "No reviews found for this user"));

  return res.status(200)
  .json(new ApiResponse(200, reviews, "User reviews fetched successfully"));
});

const getTopRatedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);

  const topProducts = await Review.aggregate([
    { $group: { _id: "$product", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    { $sort: { averageRating: -1, totalReviews: -1 } },
    { $limit: limit }
  ]);

  return res.status(200)
  .json(new ApiResponse(200, topProducts, "Top rated products fetched successfully"));
});


export { 
    createReview, 
    getAllReviews, 
    getReviewById, 
    deleteReview,
    updateReview,
    getReviewsByProduct,
    toggleReviewLike ,
    getAverageRatingForProduct,
    getReviewsByUser,
    getTopRatedProducts
};
