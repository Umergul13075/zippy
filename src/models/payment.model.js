import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order", 
        required: true 

    },
    method: {
        type: String,
        enum: ["card", "cash_on_delivery", "bank_transfer", "wallet"],
        required: true
    },
    amount: {
        type: Number, required: 
        true 
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending"
    },
    transactionId: { 
        type: String 
    },
    paidAt: { 
        type: Date 
    },
    refundReason: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    // for retry tracking 
    retryCount: {
      type: Number,
      default: 0,
    },
}, {
     timestamps: true 

});

paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ createdAt: -1 });


export const Payment = mongoose.model("Payment", paymentSchema);

