import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, trim: true },
    password_hash: { 
        type: String, 
        required: true },
    role: { 
        type: String, 
        enum: ["superadmin", "moderator", "support"], default: "support" },
        permissions: [{ 
        type: String 

    }],
    isActive: { 
        type: Boolean, 
        default: true }
}, 
{ 
    timestamps: true

 });
// check it again
// Hash password before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

export const Admin = mongoose.model("Admin", adminSchema);

