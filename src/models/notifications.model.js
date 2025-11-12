import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true  
     },
    message: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ["order", "promotion", "system", "chat"], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["read", "unread"], default: "unread" 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

export const Notification = mongoose.model("Notification", notificationSchema);
