import mongoose, { Schema } from "mongoose";

const subjectMarkSchema = new Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    marksObtained: {
      type: Number,
      default: null,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 25,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    grade: {
      type: String,
      default: "-",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const studentMarksRecordSchema = new Schema(
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
    subjectMarks: [subjectMarkSchema],
    summary: {
      totalMarksObtained: { type: Number, default: 0 },
      totalMaxMarks: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      overallGrade: { type: String, default: "-" },
      result: { type: String, default: "Pending" }, // "Pass", "Needs Improvement", "Pending"
      rank: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const marksSchema = new Schema(
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
    academicYear: {
      type: String,
      default: "2026-2027",
    },
    examType: {
      type: String,
      enum: ["FA-I", "FA-II", "SA-I", "FA-III", "FA-IV", "SA-II"],
      required: true,
    },
    examTitle: {
      type: String,
      required: true,
    },
    maxMarksPerSubject: {
      type: Number,
      required: true,
      default: 25, // 25 for FA, 60 for SA
    },
    passingPercentage: {
      type: Number,
      default: 33,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Locked"],
      default: "Draft",
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    records: [studentMarksRecordSchema],
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure one marks document per class, examType, and academicYear
marksSchema.index({ class: 1, examType: 1, academicYear: 1 }, { unique: true });

const Marks = mongoose.model("Marks", marksSchema);
export default Marks;
