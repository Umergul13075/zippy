import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Seller", 
        required: true 
    },
    report: {
       reportedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: "report.reportedByType" 
    },
    reportedByType: { 
        type: String, 
        enum: ["user", "seller"], 
    },
        reason: { 
            type: String 
        },
        reportedAt: { 
            type: Date 
        },
        resolved: { 
            type: Boolean, 
            default: false 
        },
        resolvedAt: { 
            type: Date 
        },    
    },
    messages: [{
        senderType: { 
            type: String, 
            enum: ["user", "seller"], 
            required: true 
        },
       senderId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'messages.senderType',
            required: true
        },
        content: { 
            type: String, 
            required: true 
        },
        isRead: { 
            type: Boolean, 
            default: false 
        },
        timestamp: { 
            type: Date, 
            default: Date.now 
        }
    }]
}, 
{ 
    timestamps: true 

});

chatSchema.index({ user: 1, seller: 1 });
chatSchema.index({ updatedAt: -1 });


export const Chat = mongoose.model("Chat", chatSchema);

