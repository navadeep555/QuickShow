import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        totalSeats: { type: Number, default: 90 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Theatre = mongoose.model("Theatre", theatreSchema);

export default Theatre;
