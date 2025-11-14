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
    
},  
    { 
        timestamps: true 
    }
);

transactionSchema.index({ order: 1 });   
transactionSchema.index({ seller: 1 });  
transactionSchema.index({ status: 1 });  
transactionSchema.index({ createdAt: -1 }); 
transactionSchema.index({ seller: 1, status: 1 });
export const Transaction = mongoose.model("Transaction", transactionSchema);

