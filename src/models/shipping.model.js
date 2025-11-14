import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order", 
        required: true 
    },
    address: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Address", 
        required: true 
    },
    trackingId: { 
        type: String 
    },
    carrier: { 
        type: String
     },
    status: {
        type: String,
        enum: ["processing", "in_transit", "delivered", "cancelled"],
        default: "processing"
    },
    estimatedDelivery: { 
        type: Date
    },
    deliveredAt: { 
        type: Date 
    }
}, { 
    timestamps: true 

});

shippingSchema.index({ order: 1 }); 
shippingSchema.index({ status: 1 });
shippingSchema.index({ carrier: 1 }); 
shippingSchema.index({ deliveredAt: 1 }); 
shippingSchema.index({ order: 1, status: 1 });

export const Shipping = mongoose.model("Shipping", shippingSchema);
