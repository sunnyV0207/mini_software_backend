import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";  // adjust based on your file name

const MONGO_URL = "mongodb+srv://sunnyvermaverma2005_db_user:MiniSoftware@cluster0.pwxkwl8.mongodb.net/";

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Database connected!");

    const existing = await User.findOne({ email: "sunnyvermaverma2005@gmail.com" });
    if (existing) {
      console.log("Admin already exists!");
      process.exit();
    }

    const hashedPassword = "SuperAdmin@123"

    const admin = new User({
      firstName: "Sunny",
      lastName: "Verma",
      phone: "9027259417",
      email: "sunnyvermaverma2005@gmail.com",
      password: hashedPassword,
      role: "Super Admin",
      isVerified: true,
    });

    await admin.save();

    console.log("Super Admin created successfully!");
    process.exit();
    
  } catch (err) {
    console.error(err);
    process.exit();
  }
}

seedAdmin();
