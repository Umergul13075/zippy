import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js"
const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        background_color: {
            type: String,
            trim: true,
          
        },
        display_order: {
            type: Number,
            default: 0,
            index: true 
        },
        is_active: {
            type: Boolean,
            default: true,
            
        },
        start_date: {
            type: Date,
            default: Date.now,
        },
        end_date: {
            type: Date,
           
        }
    },
    {
       
        timestamps: { createdAt: 'created_at' } 
    }
);

// Pre-save hook to ensure the start_date is before the end_date.
bannerSchema.pre("save", function (next) {
    
    if (!this.isModified('start_date') && !this.isModified('end_date') && !this.isNew) {
        return next();
    }

    // 2. Check the validation logic
    if (this.start_date && this.end_date) {
        
        if (this.start_date > this.end_date) {
            
            // --- THROWING ERROR USING THE APIERROR CLASS ---
            const validationError = new ApiError(
                400, "The banner start date cannot be later than its end date."
            );
            return next(validationError); 
        }
    }
    next();
});

export const Banner = mongoose.model("Banner", bannerSchema);