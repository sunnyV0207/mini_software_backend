import asyncHandler from "../utilities/asynchandler.js";
import ApiResponse from "../utilities/ApiResponse.js";
import ApiError from "../utilities/ApiError.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import mongoose from "mongoose";

// ==========================================
// ADD NEW STUDENT
// ==========================================
export const addStudent = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    gender,
    classNumber,
    section,
    rollNumber,
    parentName,
    parentPhone,
    password,
    confirmPassword,
    schoolCode: bodySchoolCode,
    schoolId: bodySchoolId,
  } = req.body;

  const schoolCode = req.params.schoolCode || bodySchoolCode;
  const schoolId = bodySchoolId;

  if (
    !name ||
    !email ||
    !phone ||
    !gender ||
    !classNumber ||
    !section ||
    !rollNumber ||
    !parentName ||
    !parentPhone ||
    !password
  ) {
    return next(new ApiError(400, "All fields are required"));
  }

  if (confirmPassword && password !== confirmPassword) {
    return next(new ApiError(400, "Passwords do not match"));
  }

  // 1. Find school
  let school = null;
  if (schoolCode) {
    school = await School.findOne({ schoolCode });
  } else if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
    school = await School.findById(schoolId);
  } else {
    // If neither was provided, look for school by matching class
    const sampleClass = await Class.findOne({
      classNumber: Number(classNumber),
      section: section.trim(),
    }).populate("school");
    if (sampleClass?.school) {
      school = sampleClass.school;
    }
  }

  if (!school) {
    return next(
      new ApiError(
        404,
        "School not found. Please provide a valid school code or ensure you are logged into a school."
      )
    );
  }

  // 2. Find target class in this school
  const targetClass = await Class.findOne({
    classNumber: Number(classNumber),
    section: section.trim(),
    school: school._id,
  });

  if (!targetClass) {
    return next(
      new ApiError(
        404,
        `Class ${classNumber}-${section} does not exist in ${school.schoolName}. Please create the class first.`
      )
    );
  }

  // 3. Check if user with this email already exists
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new ApiError(400, "A user with this email address already exists."));
  }

  // 4. Check if student with this roll number already exists in this class
  const existingStudentWithRoll = await User.findOne({
    class: targetClass._id,
    rollNumber: String(rollNumber).trim(),
  });
  if (existingStudentWithRoll) {
    return next(
      new ApiError(
        400,
        `Roll number '${rollNumber}' is already assigned to another student in Class ${classNumber}-${section}.`
      )
    );
  }

  // 5. Create new student
  const newStudent = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    gender,
    role: "Student",
    school: school._id,
    class: targetClass._id,
    rollNumber: String(rollNumber).trim(),
    parentName: parentName.trim(),
    parentPhone: parentPhone.trim(),
    password,
    status: "Active",
  });

  // 6. Update class and school records
  if (!targetClass.students.includes(newStudent._id)) {
    targetClass.students.push(newStudent._id);
    await targetClass.save();
  }

  if (!school.students.includes(newStudent._id)) {
    school.students.push(newStudent._id);
    await school.save();
  }

  const sanitizedStudent = await User.findById(newStudent._id)
    .populate("class")
    .populate("school", "schoolName schoolCode address contactNumber");

  return res
    .status(201)
    .json(new ApiResponse(201, "Student added successfully", sanitizedStudent));
});

// ==========================================
// GET SINGLE STUDENT
// ==========================================
export const getStudent = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return next(new ApiError(400, "Valid Student ID is required"));
  }

  const existingStudent = await User.findById(studentId)
    .populate("class")
    .populate("school", "schoolName schoolCode address contactNumber");

  if (!existingStudent || existingStudent.role !== "Student") {
    return next(new ApiError(404, "Student not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Student fetched successfully", existingStudent));
});

// ==========================================
// EDIT STUDENT
// ==========================================
export const editStudent = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return next(new ApiError(400, "Valid Student ID is required"));
  }

  const student = await User.findById(studentId).populate("class").populate("school");

  if (!student || student.role !== "Student") {
    return next(new ApiError(404, "Student not found to edit"));
  }

  const {
    name,
    email,
    phone,
    gender,
    rollNumber,
    parentName,
    parentPhone,
    classNumber,
    section,
  } = req.body;

  if (email && email.toLowerCase().trim() !== student.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new ApiError(400, "The email you entered is already in use."));
    }
    student.email = email.toLowerCase().trim();
  }

  if (name) student.name = name.trim();
  if (phone) student.phone = phone.trim();
  if (gender) student.gender = gender;
  if (rollNumber) student.rollNumber = String(rollNumber).trim();
  if (parentName) student.parentName = parentName.trim();
  if (parentPhone) student.parentPhone = parentPhone.trim();

  // If class is being changed
  if (classNumber && section && student.school) {
    const newClass = await Class.findOne({
      classNumber: Number(classNumber),
      section: section.trim(),
      school: student.school._id,
    });

    if (!newClass) {
      return next(
        new ApiError(
          404,
          `Class ${classNumber}-${section} does not exist in this school.`
        )
      );
    }

    if (String(student.class?._id) !== String(newClass._id)) {
      // Remove from old class
      if (student.class?._id) {
        await Class.findByIdAndUpdate(student.class._id, {
          $pull: { students: student._id },
        });
      }
      // Add to new class
      if (!newClass.students.includes(student._id)) {
        newClass.students.push(student._id);
        await newClass.save();
      }
      student.class = newClass._id;
    }
  }

  await student.save();

  const updatedStudent = await User.findById(student._id)
    .populate("class")
    .populate("school", "schoolName schoolCode address contactNumber");

  return res
    .status(200)
    .json(new ApiResponse(200, "Student updated successfully", updatedStudent));
});

// ==========================================
// UPDATE STUDENT STATUS (Active/Inactive)
// ==========================================
export const updateStudentStatus = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return next(new ApiError(400, "Valid Student ID is required"));
  }

  const student = await User.findById(studentId);
  if (!student || student.role !== "Student") {
    return next(new ApiError(404, "Student not found"));
  }

  student.status = student.status === "Active" ? "Inactive" : "Active";
  await student.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Student status updated successfully", student));
});

// ==========================================
// GET ALL STUDENTS BY SCHOOL
// ==========================================
export const getStudentsBySchool = asyncHandler(async (req, res, next) => {
  const { schoolCode } = req.params;
  const { classNumber, section } = req.query;

  if (!schoolCode) {
    return next(new ApiError(400, "School code is required"));
  }

  const school = await School.findOne({ schoolCode });
  if (!school) {
    return next(new ApiError(404, "School not found"));
  }

  const query = {
    school: school._id,
    role: "Student",
  };

  let students = await User.find(query)
    .populate("class")
    .populate("school", "schoolName schoolCode")
    .sort({ createdAt: -1 });

  if (classNumber || section) {
    students = students.filter((st) => {
      let matches = true;
      if (classNumber && st.class?.classNumber !== Number(classNumber)) {
        matches = false;
      }
      if (section && st.class?.section !== section) {
        matches = false;
      }
      return matches;
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Students fetched successfully", students));
});

// ==========================================
// DELETE STUDENT
// ==========================================
export const deleteStudent = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return next(new ApiError(400, "Valid Student ID is required"));
  }

  const student = await User.findById(studentId);
  if (!student || student.role !== "Student") {
    return next(new ApiError(404, "Student not found"));
  }

  // Clean up from Class
  if (student.class) {
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id },
    });
  }

  // Clean up from School
  if (student.school) {
    await School.findByIdAndUpdate(student.school, {
      $pull: { students: student._id },
    });
  }

  await User.findByIdAndDelete(studentId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Student deleted successfully", { studentId }));
});
