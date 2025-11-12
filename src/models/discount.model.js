import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true     
    },
    discountType: { 
        type: String,
         enum: ["flat", "percentage"], 
        required: true 
    },
    discountValue: { 
        type: Number, 
        required: true
     },
    appliesTo:{
        type: String,
        enum: ["all", "category", "product"],
        default: "all",
    },
    targetEntityId:{
        type: mongoose.Schema.Types.ObjectId,
        refPath:"appliesTo"
    },
    validFrom: { 
        type: Date, 
        required: true 
    },
    validTill: { 
        type: Date, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    usedBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }]
}, 
{ 
    timestamps: true 

});

export const Discount = mongoose.model("Coupon", discountSchema);

