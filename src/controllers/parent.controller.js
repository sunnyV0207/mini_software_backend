import asyncHandler from "../utilities/asynchandler.js";
import ApiResponse from "../utilities/ApiResponse.js";
import ApiError from "../utilities/ApiError.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import mongoose from "mongoose";

// ==========================================
// ADD NEW PARENT
// ==========================================
export const addParent = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    name,
    email,
    phone,
    gender,
    occupation,
    address,
    password,
    confirmPassword,
    children,
    studentIds,
    schoolCode: bodySchoolCode,
    schoolId: bodySchoolId,
  } = req.body;

  const parentName = fullName || name;
  const schoolCode = req.params.schoolCode || bodySchoolCode;
  const schoolId = bodySchoolId;

  if (!parentName || !email || !phone || !gender || !password) {
    return next(new ApiError(400, "Name, email, phone, gender, and password are required."));
  }

  if (confirmPassword && password !== confirmPassword) {
    return next(new ApiError(400, "Passwords do not match."));
  }

  // 1. Resolve school
  let school = null;
  if (schoolCode) {
    school = await School.findOne({ schoolCode });
  } else if (schoolId && mongoose.Types.ObjectId.isValid(schoolId)) {
    school = await School.findById(schoolId);
  }

  if (!school) {
    return next(
      new ApiError(404, "School not found. Please provide a valid school identifier.")
    );
  }

  // 2. Check email uniqueness
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new ApiError(400, "A user with this email address already exists."));
  }

  // 3. Process children student IDs
  let rawChildren = children || studentIds || [];
  if (typeof rawChildren === "string") {
    rawChildren = [rawChildren];
  }

  const validStudentIds = rawChildren.filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );

  // 4. Create Parent User
  const newParent = await User.create({
    name: parentName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    gender,
    occupation: occupation ? occupation.trim() : null,
    address: address ? address.trim() : null,
    password,
    role: "Parent",
    school: school._id,
    children: validStudentIds,
    status: "Active",
  });

  // 5. Update bidirectional relationship on each child (student)
  if (validStudentIds.length > 0) {
    await User.updateMany(
      { _id: { $in: validStudentIds } },
      {
        $set: {
          parent: newParent._id,
          parentName: newParent.name,
          parentPhone: newParent.phone,
        },
      }
    );
  }

  // 6. Update school record
  if (!school.parents.includes(newParent._id)) {
    school.parents.push(newParent._id);
    await school.save();
  }

  const sanitizedParent = await User.findById(newParent._id)
    .populate({
      path: "children",
      populate: { path: "class" },
    })
    .populate("school", "schoolName schoolCode address contactNumber");

  return res
    .status(201)
    .json(new ApiResponse(201, "Parent registered successfully", sanitizedParent));
});

// ==========================================
// GET SINGLE PARENT
// ==========================================
export const getParent = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;

  if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
    return next(new ApiError(400, "Valid Parent ID is required."));
  }

  const parent = await User.findById(parentId)
    .populate({
      path: "children",
      populate: { path: "class" },
    })
    .populate("school", "schoolName schoolCode address contactNumber");

  if (!parent || parent.role !== "Parent") {
    return next(new ApiError(404, "Parent not found."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Parent fetched successfully", parent));
});

// ==========================================
// EDIT PARENT
// ==========================================
export const editParent = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;

  if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
    return next(new ApiError(400, "Valid Parent ID is required."));
  }

  const parent = await User.findById(parentId);

  if (!parent || parent.role !== "Parent") {
    return next(new ApiError(404, "Parent not found to edit."));
  }

  const {
    fullName,
    name,
    email,
    phone,
    gender,
    occupation,
    address,
    children,
    studentIds,
  } = req.body;

  const parentName = fullName || name;

  if (email && email.toLowerCase().trim() !== parent.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new ApiError(400, "The email you entered is already in use."));
    }
    parent.email = email.toLowerCase().trim();
  }

  if (parentName) parent.name = parentName.trim();
  if (phone) parent.phone = phone.trim();
  if (gender) parent.gender = gender;
  if (occupation !== undefined) parent.occupation = occupation ? occupation.trim() : null;
  if (address !== undefined) parent.address = address ? address.trim() : null;

  // Update children linkage if passed
  if (children !== undefined || studentIds !== undefined) {
    let rawChildren = children !== undefined ? children : studentIds;
    if (typeof rawChildren === "string") {
      rawChildren = [rawChildren];
    }
    const newChildrenIds = (rawChildren || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const oldChildrenIds = (parent.children || []).map((id) => String(id));

    // Students to unbind (present in old but not in new)
    const removedChildren = oldChildrenIds.filter(
      (id) => !newChildrenIds.includes(id)
    );
    if (removedChildren.length > 0) {
      await User.updateMany(
        { _id: { $in: removedChildren }, parent: parent._id },
        { $set: { parent: null } }
      );
    }

    // Students to bind (present in new)
    if (newChildrenIds.length > 0) {
      await User.updateMany(
        { _id: { $in: newChildrenIds } },
        {
          $set: {
            parent: parent._id,
            parentName: parent.name,
            parentPhone: parent.phone,
          },
        }
      );
    }

    parent.children = newChildrenIds;
  }

  await parent.save();

  const updatedParent = await User.findById(parent._id)
    .populate({
      path: "children",
      populate: { path: "class" },
    })
    .populate("school", "schoolName schoolCode address contactNumber");

  return res
    .status(200)
    .json(new ApiResponse(200, "Parent updated successfully", updatedParent));
});

// ==========================================
// UPDATE PARENT STATUS (Active/Inactive)
// ==========================================
export const updateParentStatus = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;

  if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
    return next(new ApiError(400, "Valid Parent ID is required."));
  }

  const parent = await User.findById(parentId);
  if (!parent || parent.role !== "Parent") {
    return next(new ApiError(404, "Parent not found."));
  }

  parent.status = parent.status === "Active" ? "Inactive" : "Active";
  await parent.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Parent status updated successfully", parent));
});

// ==========================================
// GET ALL PARENTS BY SCHOOL
// ==========================================
export const getParentsBySchool = asyncHandler(async (req, res, next) => {
  const { schoolCode } = req.params;

  if (!schoolCode) {
    return next(new ApiError(400, "School code is required."));
  }

  const school = await School.findOne({ schoolCode }).populate({
    path: "parents",
    populate: {
      path: "children",
      populate: { path: "class" },
    },
  });

  if (!school) {
    return next(new ApiError(404, "School not found."));
  }

  const parents = school.parents || [];

  return res
    .status(200)
    .json(new ApiResponse(200, "Parents fetched successfully", parents));
});

// ==========================================
// DELETE PARENT
// ==========================================
export const deleteParent = asyncHandler(async (req, res, next) => {
  const { parentId } = req.params;

  if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
    return next(new ApiError(400, "Valid Parent ID is required."));
  }

  const parent = await User.findById(parentId);
  if (!parent || parent.role !== "Parent") {
    return next(new ApiError(404, "Parent not found."));
  }

  // Unlink children
  await User.updateMany({ parent: parentId }, { $set: { parent: null } });

  // Clean up from School
  if (parent.school) {
    await School.findByIdAndUpdate(parent.school, {
      $pull: { parents: parent._id },
    });
  }

  await User.findByIdAndDelete(parentId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Parent deleted successfully", { parentId }));
});
