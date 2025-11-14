import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler (async (req, _, next) => {
  console.log(" Verifying JWT...");   
  try{
          const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") 

     if(!token){
          throw new ApiError(401, "Unauthorized Access")
     }
     
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     console.log("Decoded user:", decodedToken);

     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

      
     if(!user){
        throw new ApiError(401, "Invalid Access Token")
     }
     if (user.accountStatus === "suspended") {
     throw new ApiError(403, "Your account is suspended. Contact support.");
     }

     if (user.accountStatus === "deleted") {
     throw new ApiError(403, "This account has been deleted.");
    }

     req.user = user;
     next()
     }
     catch(error){
     throw new ApiError(401, error?.message || "Invalid Access Token")
       }
       
});

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission for this action");
    }

    next();
  };
};

