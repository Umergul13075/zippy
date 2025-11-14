import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order" 
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true,
         min: 1 
    },
    price: { 
        type: Number, 
        required: true 
    },
    subtotal: { 
        type: Number 
    }
}, 
{ 
    timestamps: true 

});

orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });
export const OrderItem = mongoose.model("OrderItem", orderItemSchema);

