import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: false, 
            index: true 
        },
        search_query: {
            type: String,
            required: true,
            trim: true,
            
        }
      
    },
    {
       
        timestamps: { createdAt: "searched_at" } 
    }
);

searchHistorySchema.index({ search_query: 1 });

export const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);