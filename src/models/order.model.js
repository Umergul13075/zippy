import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", required: true 
        
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Seller", required: true 
        
    },
    items: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "OrderItem", required: true 
        
    }],
    payment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Payment" 
        
    },
    shipping: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Shipping" 
        
    },
    coupon: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Coupon"
        
     },
    totalAmount: { 
        type: Number, required: true 
        
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        default: "pending"
    }
},
 { 
    timestamps: true 
    
});

orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1 });
orderSchema.index({ seller: 1 });

export const Order = mongoose.model("Order", orderSchema);

