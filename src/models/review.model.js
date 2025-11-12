import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true  
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true,
        index: true 
    },
    rating: { 
        type: Number, 
        required: true,
         min: 1, 
        max: 5 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    likes: [
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
    }
    ],

},
    { 
    timestamps: true 
    }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

export const Review = mongoose.model("Review", reviewSchema);

