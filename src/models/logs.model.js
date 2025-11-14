import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },
    action: {
        type: String,
        enum: ["login", "view_product", "add_to_cart", "purchase", "logout"],
        required: true
    },
    entityId: { 
        type: mongoose.Schema.Types.ObjectId 
    }, // e.g., Product or Order
    ipAddress: { 
        type: String, 
        required: false,
        trim: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now }
}, 
{ 
    timestamps: true 

});

analyticsSchema.index({ user: 1 });
analyticsSchema.index({ action: 1 });
analyticsSchema.index({ entityId: 1 });
analyticsSchema.index({ timestamp: -1 });
export const Analytics = mongoose.model("Analytics", analyticsSchema);

