import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order", 
            required: true,
            index: true 
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", 
            required: true,
        },
        
        product_name: {
            type: String,
            required: true,
            trim: true,
        },
        product_price: {
            type: mongoose.Schema.Types.Decimal128, 
            required: true,
            min: 0
        },
        
        
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        subtotal: {
            type: mongoose.Schema.Types.Decimal128,
            // (quantity x product_price) have to do in controller  order.controller.js
            required: true,
            min: 0
        }
    },
    {
       
        timestamps: { createdAt: 'created_at' } 
    }
);

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);