import mongoose from "mongoose";

const productSpecificationSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product", 
            required: true,
            index: true 
        },
        spec_key: { // attribute name 
             type: String,
            required: true,
            trim: true,
            // example: Screen size
          
        },
        spec_value: {  // attribute value 
            type: String,
            required: true,
            trim: true,
            // example: "6.1 inches" 
            
        }
        // spec_key and spec_value act as key value pair for making product unique features 
    },
    {
        
        timestamps: { 
            createdAt: "created_at" 
        } 
    }
);

productSpecificationSchema.index({ product_id: 1, spec_key: 1 });
productSpecificationSchema.index({ spec_value: 1 });
export const ProductSpecification = mongoose.model("ProductSpecification", productSpecificationSchema);