import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true,
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    // avatar:{
    //     type: String, // cloudinary URL
    //     required: true
    // },
    // coverImage:{
    //     type: String, // cloudinary URL
    // },
    
    // we will use bcrypt npm package for securing the password
    password:{
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be 8 characters long"]
    },
    refreshToken:{
        type: String
    },
    accountStatus: {
        type: String,
        enum: ["active", "suspended", "deleted"],
        default: "active"
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user"
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordExpiry:{
        type: Date
    }   
},

    {
        timestamps : true
    }
)

userSchema.pre("save", async function(next){

    if(!this.isModified("password")) return next();
    if(this.password){
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
    next();

})
// custom methods to check is password correct
userSchema.methods.isPasswordCorrect = async function (password){
  return await bcrypt.compare(password, this.password)
}

// jwt tokens (jason web tokens)
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        // Payload
        {
            _id: this._id, // auto generated mongodb id
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            role: this.role,
            accountStatus: this.accountStatus,
        },
        // secretKey
        process.env.ACCESS_TOKEN_SECRET,
        // expiry/options
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
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

// protecting the sensitive data so it doesn't go to frontend
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    return ret;
  },
});

userSchema.index({ username: 1, email: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema)

