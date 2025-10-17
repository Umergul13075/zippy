import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // highly searchable
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
        // Fullname is important for shipping/orders
        index: true
    },
    phone_number:{
        type: String,
        required: true,
        // phone_number should be unique for valid user account
        unique: true, 
        trim: true,
        index: true
    },
    password_hash:{
        type: String,
        required: [true, "Password is required"]
    },
    is_active: { 
        type: Boolean,
        default: true
    },
    refreshToken:{
        type: String
    }

},
{ timestamps: true })

// mongoose middleware-function runs automatically before saving user
userSchema.pre("save", async function(next){

    if(!this.isModified("password_hash")) return next();
    
    this.password_hash = await bcrypt.hash(this.password_hash, 12)
    next()
})

// custom method for password check if correct or not
userSchema.methods.isPasswordCorrect = async function (password){
  return await bcrypt.compare(password, this.password_hash)
}

// generate json web tokens 
// access tokem
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        // Payload
        {
            _id: this._id, // auto generated mongodb id
            email: this.email,
            full_name: this.full_name
        },
        // secretKey
        process.env.ACCESS_TOKEN_SECRET,
        // expiry/options
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
// refresh token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}
export const User = mongoose.model("User", userSchema);