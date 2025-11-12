import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    order: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order", 
        required: true  
    },
    seller: { 
 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Seller", 
        required: true 
    },
    amount: { 
         type: Number, 
        required: true 

    },
    status: { 
        type: String, 
        enum: ["pending", "completed", "failed"], 
        default: "pending" 
    },
    invoiceUrl: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

export const Transaction = mongoose.model("Transaction", transactionSchema);

