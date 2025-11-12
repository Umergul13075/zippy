import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true // Important for product search performance
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number, // Use Number for currency/decimal values in Mongoose
            required: true,
            min: 0
        },
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category", 
            required: true
        },
        image: {
            type: String, 
            trim: true
        },
        rating: {
            type: Number,
            default: 0.0,
            min: 0,
            max: 5 
        },
        reviews_count: {
            type: Number,
            default: 0,
            min: 0
        },
        stock_quantity: {
            type: Number,
            required: true,
            min: 0,
            index: true 
        },
        brand: {
           type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
            trim: true,
            index: true 
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller"
        },
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory"
        },
        warranty: {
            type: String, 
            trim: true
        },
        is_active: {
            type: Boolean,
            default: true,  
        },
        is_featured: {
        type: Boolean,
        default: false
        }
    },
    {
        timestamps: true 
    }
);

export const Product = mongoose.model("Product", productSchema);