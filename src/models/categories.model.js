import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Categories should have unique names to avoid duplications
            trim: true,
            index: true // Highly searchable field for the site navigation
        },
        icon_name: { // what is this field doing?
            type: String,
            trim: true,
            
        },
        display_order: { // what is this field doing?
            type: Number,
            default: 0,
            
        },
        is_active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true 
    }
);

export const Category = mongoose.model("Category", categorySchema);