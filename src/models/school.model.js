import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    schoolName: { type: String, required: true },
    schoolCode: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },

    // principal is NOT required initially
    principal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const School = mongoose.model("School", schoolSchema);

export default School;
