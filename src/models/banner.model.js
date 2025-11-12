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
        targetUrl: { 
            type: String, 
            required: true 
        },
        backgroundColor: {
            type: String,
            trim: true,
          
        },
        displayOrder: {
            type: Number,
            default: 0,
            index: true 
        },
        isAactive: {
            type: Boolean,
            default: true,
            
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
           
        }
    },
    {
       
        timestamps: { createdAt: 'created_at' } 
    }
);

// Pre-save hook to ensure the start_date is before the end_date.
bannerSchema.pre("save", function (next) {
    
    if (!this.isModified('startDate') && !this.isModified('endDate') && !this.isNew) {
        return next();
    }

    // 2. Check the validation logic
    if (this.startDate && this.endDate) {
        
        if (this.startDate > this.endDate) {
            
            // --- THROWING ERROR USING THE APIERROR CLASS ---
            const validationError = new ApiError(
                400, "The banner start date cannot be later than its end date."
            );
            return next(validationError); 
        }
    }
    next();
});

bannerSchema.index({ isAactive: 1, startDate: 1, endDate: 1 });

export const Banner = mongoose.model("Banner", bannerSchema);