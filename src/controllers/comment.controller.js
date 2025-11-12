import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Review } from "../models/review.model.js";
import mongoose from "mongoose";


const addComment = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) throw new ApiError(400, "Comment text is required");

    if (!mongoose.Types.ObjectId.isValid(reviewId))
    throw new ApiError(400, "Invalid review ID");

    const review = await Review.findById(reviewId)
    .lean();
    
    if (!review) throw new ApiError(404, "Review not found");

    const comment = await Comment.create({
    review: reviewId,
    user: req.user._id,
    text: text.trim(),
    });

    return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const editComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) throw new ApiError(400, "Comment text is required");

    if (text.length > 500)
    throw new ApiError(400, "Comment text too long (max 500 characters)");

    if (!mongoose.Types.ObjectId.isValid(commentId))
    throw new ApiError(400, "Invalid comment ID");

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.user.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not authorized to edit this comment");

    comment.text = text.trim();
    await comment.save();

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId))
    throw new ApiError(400, "Invalid comment ID");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (
    comment.user.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
    ) {
    throw new ApiError(403, "Not authorized to delete this comment");
    }

    await comment.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});


const toggleLikeOnComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(commentId))
    throw new ApiError(400, "Invalid comment ID");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    let updatedComment;

    if (comment.likes.includes(userId)) {
    updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $pull: { likes: userId } },
    { new: true }
    )
    .lean();

    return res.status(200)
    .json(new ApiResponse(200, updatedComment, "Comment unliked"));
    } 
    else {
    updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $addToSet: { likes: userId } },
    { new: true }
    )
    .lean();
    
    return res.status(200)
    .json(new ApiResponse(200, updatedComment, "Comment liked"));
    }
});

const getCommentsByReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(reviewId))
    throw new ApiError(400, "Invalid review ID");

    const comments = await Comment.find({ review: reviewId })
    .populate("user", "name email")
    .select("text likes createdAt user")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    return res
    .status(200)
    .json(new ApiResponse(200, {
    comments,
    pagination: { page, limit, total: comments.length },
    }, "Comments fetched successfully"));
});

const getCommentById = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId))
    throw new ApiError(400, "Invalid comment ID");

  const comment = await Comment.findById(commentId)
    .populate("user", "name email")
    .populate("review", "rating")
    .lean();

  if (!comment) throw new ApiError(404, "Comment not found");

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment fetched successfully"));
});

const getCommentsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new ApiError(400, "Invalid user ID");

  const comments = await Comment.find({ user: userId })
    .populate("review", "rating")
    .sort({ createdAt: -1 })
    .lean();

  if (!comments.length)
    throw new ApiError(404, "No comments found for this user");

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "User comments fetched successfully"));
});

const deleteCommentsByReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reviewId))
    throw new ApiError(400, "Invalid review ID");

  const deleted = await Comment.deleteMany({ review: reviewId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCount: deleted.deletedCount },
        "All comments deleted for this review"
      )
    );
});

const getCommentCountForReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reviewId))
    throw new ApiError(400, "Invalid review ID");

  const count = await Comment.countDocuments({ review: reviewId });

  return res
    .status(200)
    .json(new ApiResponse(200, { count }, "Comment count fetched successfully"));
});


export {
    addComment,
    editComment,
    deleteComment,
    toggleLikeOnComment,
    getCommentsByReview,
    getCommentById,
    getCommentsByUser,
    deleteCommentsByReview,
    getCommentCountForReview
};
