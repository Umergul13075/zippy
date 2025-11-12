import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, 
            trim: true,
            index: true 
        },
        parentCategory: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category', 
            default: null 
        },
        slug: { 
            type: String, 
            required: true, 
            unique: true 
        },
        iconUrl: { // what is this field doing?
            type: String,
            trim: true,
            
        },
        displayOrder: { 
            type: Number,
            default: 0,
            
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true 
    }
);

export const Category = mongoose.model("Category", categorySchema);