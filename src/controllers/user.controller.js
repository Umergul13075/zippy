import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
// import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import fs from "fs";
// import {deleteFromCloudinary} from "../utils/cloudinary.js"
import bcrypt from "bcrypt";

const generateAccessAndRefereshToken = async (userId) =>{
    try{
        const user = await User.findById(userId)
        if (!user) throw new ApiError(404, "User not found");
        const accessToken = user.generateAccessToken()
        const refreshToken =user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    
    const {fullName, username, email, password} =req.body
    
    if(
        [fullName, email, password, username].some((field) =>
            field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    
    const existedUser = await User.findOne({
        $or: [ {username}, {email} ]
    })
    
    if(existedUser){
        throw new ApiError(409, "Username or email already exists")
    }

    
    // const avatarLocalPath = req.files?.avatar[0]?.path
   
    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
    //     coverImageLocalPath = req.files.coverImage[0].path
    // } 
    
    // if(!avatarLocalPath){
    //     throw new ApiError (400, "Avatar file is required")
    // }

  
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if(!avatar){
    //     throw new ApiError (400, "Avatar file is required")
    // }

    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        // avatar: avatar.url,
        // coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        password, 
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError (500, "Something went wrong while  registreing the user")
    }   

    // console.log(refreshToken);
    // console.log(accessToken);

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully!")
    )

})

const loginUser = asyncHandler(async (req,res) => {
    

   const {username, email, password} = req.body

   if(!username && !email){
    throw new ApiError(400,"username or email is required!")
   }
    
   const user = await User.findOne({
    $or : [{ username } , { email }]
   })
  

   if(!user){
    throw new ApiError(400,"User does not exist")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
   }

   const {accessToken, refreshToken} = await generateAccessAndRefereshToken(user._id)

   const loggedInUser = await User.findById(user._id)
   .select("-password -refreshToken")


   const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
   }
   return res.status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
   )
})


const logoutUser = asyncHandler( async (req, res) => {
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 ,
            }
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {} ,"User logged out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   
    const incommingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try{
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid Refresh Token")
    }
    if (!user.refreshToken) {
    throw new ApiError(403, "Session expired. Please log in again");
    }

    if(incommingRefreshToken !== user.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }
    
    const options = {
        httpOnly : true,
        secure : false,
        // sameSite: 'Lax',
    } 

    const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken : newRefreshToken},
            "Access token refreshed"
        )
    )
    }
    catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) 

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed Successfully"
    ))
})

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "Current User Fetched Successfully"
    ))
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const{fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required!")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{fullName, email}
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account Updated Successfully"
    ))
})

// const updateUserAvatar = asyncHandler(async (req, res) => {
//     if (!req.user?._id) {
//         throw new ApiError(401, "Unauthorized request");
//     }

//     const avatarLocalPath = req.file?.path;
//     if (!avatarLocalPath) {
//         throw new ApiError(400, "Avatar file is missing");
//     }

//     let avatar;
//     try {
//         avatar = await uploadOnCloudinary(avatarLocalPath);
//         fs.unlinkSync(avatarLocalPath); 
//     } catch (error) {
//         console.error("Cloudinary upload failed:", error);
//         if (fs.existsSync(avatarLocalPath)) {
//             fs.unlinkSync(avatarLocalPath); 
//         }
//         throw new ApiError(500, "Error uploading avatar");
//     }

//     if (!avatar?.url) {
//         throw new ApiError(400, "Error while uploading avatar");
//     }

//     const existingUser = await User.findById(req.user._id);
//     if (!existingUser) {
//         throw new ApiError(404, "User not found");
//     }
    
//     if (existingUser.avatarPublicId) {
//         await deleteFromCloudinary(existingUser.avatarPublicId);
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user._id,
//         {
//             $set: {
//                 avatar: avatar.url,
//                 avatarPublicId: avatar.public_id
//             }
//         },
//         { new: true }
//     ).select("-password -refreshToken");

//     return res.status(200).json(
//         new ApiResponse(200, user, "Avatar image updated successfully")
//     );
// });


// const updateUserCoverImage = asyncHandler(async (req, res)=>{
//     const coverImageLocalPath = req.file?.path
//     if(!coverImageLocalPath){
//         throw new ApiError(400,"Cover image is missing")
//     }
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

//     if(!coverImage.url){
//         throw new ApiError(400, "Error while uploading the coverImage")
//     }
//     fs.unlinkSync(coverImageLocalPath);
//      const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set:{
//                 coverImage: coverImage.url
//             }
//         },
//         {
//             new : true
//         }
//      ).select("-password")
     
//      return res
//      .status(200)
//      .json(
//         new ApiResponse(200,user,"Cover image updated Successfully")
//      )
// })

// admin controllers
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, status, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (status) query.accountStatus = status;
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password -refreshToken")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalUsers = await User.countDocuments(query);

  res
    .status(200)
    .json(
      new ApiResponse(200, { users, totalUsers, page, limit }, "Users fetched successfully")
    );
});

// get single user by id httpOnly
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User details fetched successfully"));
});

//  Update user role (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["user", "admin", "seller"];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role type");
  }

const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User role updated successfully"));
})

// Update user account status 
const updateAccountStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["active", "suspended", "deleted"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid account status");
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { accountStatus: status },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account status updated successfully"));
});

//  Delete user (Soft delete for Admin or User)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Allow self delete or admin delete
  if (req.user.role !== "admin" && req.user._id.toString() !== id) {
    throw new ApiError(403, "You are not allowed to delete this user");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { accountStatus: "deleted" },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User deleted successfully"));
});


//  Deactivate account (User side)
 const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { accountStatus: "suspended" },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Account deactivated temporarily"));
});


//  Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // In a real app: generate reset token & send email/OTP
  const resetToken = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP (temporary example)
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 2 mins
  await user.save();

  console.log("Password reset OTP for email,", email , "is: ", resetToken)
  // TODO: Send resetToken via email using nodemailer or AWS SES
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset instructions sent to email"));
});

// @desc Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordToken: otp,
    resetPasswordExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  console.log(otp);

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
 
  res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    //updateUserAvatar,
    // updateUserCoverImage,
    forgotPassword,
    resetPassword,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateAccountStatus,
    deleteUser,
    deactivateAccount,
}