import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // Clerk user ID
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent model overwrite during hot reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
