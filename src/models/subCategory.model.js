import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true
     },
    slug: { 
        type: String, 
        required: true 
    },
    category: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", 
        required: true 
    }
}, { timestamps: true });


subcategorySchema.index({ name: 1 });     
subcategorySchema.index({ slug: 1 });     
subcategorySchema.index({ category: 1 }); 
subcategorySchema.index({ category: 1, name: 1 });
export const Subcategory = mongoose.model("Subcategory", subcategorySchema);
