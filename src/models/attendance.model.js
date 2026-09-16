import mongoose, { Schema } from "mongoose";

const dailyRecordSchema = new Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "HalfDay", "Holiday", "Sunday", "Unmarked"],
      default: "Unmarked",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const studentAttendanceSchema = new Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rollNumber: {
      type: String,
      default: "",
    },
    studentName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      default: "Male",
    },
    daily: [dailyRecordSchema],
    summary: {
      totalWorkingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      holidayDays: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const attendanceSchema = new Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Completed", "Locked"],
      default: "Draft",
    },
    totalDays: {
      type: Number,
      required: true,
    },
    totalWorkingDays: {
      type: Number,
      default: 0,
    },
    holidays: {
      type: [Number],
      default: [],
    },
    records: [studentAttendanceSchema],
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure only one attendance register per class, month, and year
attendanceSchema.index({ class: 1, month: 1, year: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
