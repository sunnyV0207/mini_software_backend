import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
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

    // Optional fields depending on future features
    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // IMPORTANT: prevents sending password
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Others"],
    },

    role: {
      type: String,
      enum: ["Super Admin", "Principal", "Teacher", "Student", "Parent"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // Student specific fields
    rollNumber: {
      type: String,
      default: null,
    },

    parentName: {
      type: String,
      default: null,
    },

    parentPhone: {
      type: String,
      default: null,
    },

    // 🔥 Principal / Teacher / Student will belong to a school
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null
      // required: true
    },

    // For students (reference to parent)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // For parents (multiple children students)
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    occupation: {
      type: String,
      default: null,
    },

    address: {
      type: String,
      default: null,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpiration: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);



userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
    // next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const User = mongoose.model('User', userSchema);
export default User;
