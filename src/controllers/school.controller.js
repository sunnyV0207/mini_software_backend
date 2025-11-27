import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import School from '../models/school.model.js';

export const fetchSchools = asyncHandler(async (req, res, next) => {
    const schools = await School.find().select('-__v -createdAt -updatedAt').populate("principal","name");

    if (schools.length === 0) {
        return next(new ApiError(404, 'No schools found'));
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Schools fetched successfully',
            {schools}
        )
    )
});

export const addSchool = asyncHandler(async (req, res, next) => {
    const {schoolName, schoolCode, address, contactNumber} = req.body;
    if (!schoolName || !schoolCode || !address || !contactNumber) {
        return next(new ApiError(400,'All fields are required'));
    }

    const existingSchool = await School.findOne({schoolCode});
    if (existingSchool) {
        return next(new ApiError(400,'School with this code already exists'));
    }

    const newSchool = new School({
        schoolName,
        schoolCode,
        address,
        contactNumber
    });

    await newSchool.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'School added successfully',
            {schoolName, address, contactNumber}
        )
    )
});

export const getSchoolByCode = asyncHandler(async (req, res, next) => {
    const {schoolCode} = req.params;
    const school = await School.findOne({schoolCode}).select('-__v -createdAt -updatedAt').populate("principal","name email phone");

    if (!school) {
        return next(new ApiError(404, 'School not found'));
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'School fetched successfully',
            {school}
        )
    )
});

export const editSchool = asyncHandler(async (req, res, next) => {
    const {schoolCode} = req.params;
    const {schoolName, address, contactNumber} = req.body;
    const school = await School.findOne({schoolCode});

    if (!school) {
        return next(new ApiError(404, 'School not found'));
    }

    school.schoolName = schoolName || school.schoolName;
    school.address = address || school.address;
    school.contactNumber = contactNumber || school.contactNumber;
    await school.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'School updated successfully',
            {school}
        )
    )
});

export const editSchoolStatus = asyncHandler(async (req, res, next) => {
    const {schoolId} = req.params;
    console.log("School ID to update status:", schoolId);
    const school = await School.findById(schoolId);

    if (!school) {
        return next(new ApiError(404, 'School not found'));
    }

    school.status == 'Active' ? school.status = 'Inactive' : school.status = 'Active';

    await school.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'School status updated successfully',
            {school}
        )
    )
});