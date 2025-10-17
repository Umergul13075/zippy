import mongoose from "mongoose";

// Defining the Reusable Enum Arrays for ease and self clarity
// These are used for validation and consistency across the model
const PAYMENT_METHODS = ['cash_on_delivery', 'card_payment', 'mobile_banking', 'pending_payment'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true,
            index: true
        },
        order_number: {
            type: String,
            required: true,
            unique: true, 
            index: true
        },
        
        // Financial Fields 
        // Decimal128 is the standard, professional way to store money in MongoDB
        subtotal: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0
        },
        delivery_fee: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0
        },
        discount: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0
        },
        total_amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0
        },
        
        // --- Status and Payment ---
        payment_method: {
            type: String,
            enum: PAYMENT_METHODS, 
            default: "pending_payment"
        },
        order_status: {
            type: String,
            enum: ORDER_STATUSES,
            default: "pending",
            index: true
        },
        
        // --- References and Dates ---
        // IMPORTANT: We use the Address ID, but in a real-world system, you 
        // should EMBED the address details here to "snapshot" the address 
        // at the time of the order (so changes to the Address collection don't break old orders).
        delivery_address_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address", 
            required: true 
        },
        order_date: {
            type: Date,
            default: Date.now, // Captures when the order was officially placed
            index: true
        },
        delivery_date: {
            type: Date,
            nullable: true // Estimated or actual delivery date, updated later
        }
    },
    {
        
        timestamps: true 
    }
);

// Add a compound index to help prevent duplicate orders by the same user quickly (optional)
orderSchema.index({ user_id: 1, order_date: -1 });

export const Order = mongoose.model("Order", orderSchema);