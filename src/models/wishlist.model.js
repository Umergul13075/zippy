import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    products: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product" 
    }]
    }, 
    { 
    timestamps: true 
    });

wishlistSchema.index({ user: 1 });          
wishlistSchema.index({ products: 1 });      
wishlistSchema.index({ user: 1, products: 1 });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
