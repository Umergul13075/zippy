import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
     },
     addressType: { // validation for province and country and data 
        type: String, 
        enum: ['shipping', 'billing', 'default'], 
        required: true 
    },
    street: { 
        type: String, 
        required: [true, "Street address is required"],
        trim: true
    },
    city: { 
        type: String, 
        required: [true, "City is required"],
        trim: true,
        index: true,
    },
    province: { 
        type: String, 
        required: [true, "Province is required"],
        trim: true
    },
    country: { 
        type: String, 
        required: [true, "Country is required"],
        trim: true, 
    },
    postalCode: { 
        type: String, 
        required: [true, "Postal code is required"],
        match: [/^[A-Za-z0-9- ]+$/, "Invalid postal code format"]
    },
    isDefault: {
        type: Boolean, 
        default: false,
        index: true, 
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
}, 
    { 
        timestamps: true 

    }
);

// for default shipping address of a user
addressSchema.index({ user: 1, isDefault: 1 });
// for large system speed up (user + city)
addressSchema.index({ user: 1, city: 1 });

// only one default address per user
addressSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

addressSchema.pre(/^find/, function (next) {
  // Exclude deleted addresses from all find() calls
  if (!this.getQuery().includeDeleted) {
    this.where({ deletedAt: null });
  } else {
    delete this.getQuery().includeDeleted; 
  }
  next();
});

addressSchema.pre("save", function (next) {
  this.city = this.city.charAt(0).toUpperCase() + this.city.slice(1).toLowerCase();
  this.province = this.province.charAt(0).toUpperCase() + this.province.slice(1).toLowerCase();
  next();
});

export const Address = mongoose.model("Address", addressSchema);

