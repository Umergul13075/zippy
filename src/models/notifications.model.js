import mongoose from "mongoose";

const NOTIFICATION_TYPES = ['order', 'promotion', 'system', 'review', 'payment'];

const notificationSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true,
            index: true 
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: NOTIFICATION_TYPES, 
            required: true,
            index: true 
        },
        is_read: {
            type: Boolean,
            default: false,
            index: true 
        }
    },
    {
        timestamps: { createdAt: 'created_at' } 
    }
);

export const Notification = mongoose.model("Notification", notificationSchema);