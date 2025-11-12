import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    varient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "ProductVarient", 
        required: true 
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Seller", 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    }
}, 
{ 
    timestamps: true 
});

export const Inventory = mongoose.model("Inventory", inventorySchema);
