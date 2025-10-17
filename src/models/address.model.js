import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true,
            index: true 
        },
        full_name: {
            type: String,
            required: true,
            trim: true,
            
        },
        phone_number: {
            type: String,
            required: true,
            trim: true,
            
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            
        },
        address_line: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        postal_code: {
            type: String,
            trim: true,
        },
        is_default: {
            type: Boolean,
            default: false,
            // Only one address per user should be marked as default (requires logic in the service layer)
        }
    },
    {
       
        timestamps: true 
    }
);

export const Address = mongoose.model("Address", addressSchema);