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

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // IMPORTANT: prevents sending password
    },

    role: {
      type: String,
      enum: ["Super Admin", "Principal", "Teacher", "Student", "Parent"],
      required: true,
    },

    // 🔥 Principal will belong to a school
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },

    // Optional fields depending on future features
    phone: {
      type: String,
    },

    address: {
      type: String,
    },

    // For students
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
