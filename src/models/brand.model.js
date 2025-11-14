import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "seller",
    },
    slug: { 
        type: String, 
        required: true
    },
    logo:{
        type: String,
        required: true
    },
    isActive:{
        type: String,
        default: true
    } 
    },
    { 
        timestamps: true 

    }
);

brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 });
brandSchema.index({ createdBy: 1 });

export const Brand = mongoose.model("Brand", brandSchema);
