import mongoose from "mongoose";

const returnSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order", 
        required: true 
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    reason: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["requested", "approved", "rejected", "refunded"], 
        default: "requested" 
    },
    refundAmount: { 
        type: Number 
    },
    requestedAt: { 
        type: Date, 
        default: Date.now 
    },
    resolvedAt: { 
        type: Date
    }
}, 
{ 
    timestamps: true 

});

returnSchema.index({ order: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ product: 1 });


export const Return = mongoose.model("Return", returnSchema);
