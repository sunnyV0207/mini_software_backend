import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import User from '../models/user.model.js';
import School from '../models/school.model.js';

export const fetchPrincipals = asyncHandler(async (req, res, next) => {
    const principals = await User.find({role: 'Principal'}).populate('school','schoolName schoolCode');
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principals fetched successfully',
            principals
        )
    )
});

export const getPrincipalById = asyncHandler(async (req, res, next) => {
    const {principalId} = req.params;
    const principal = await User.findById(principalId).populate('school','schoolName schoolCode');
    if (!principal) {
        return next(new ApiError(404,'Principal not found'));
    }
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principal fetched successfully',
            {principal}
        )
    )
});

export const addPrincipal = asyncHandler(async (req, res, next) => {
    const {name, email, phone, schoolId, password} = req.body;
    if (!name || !email || !phone || !schoolId || !password) {
        return next(new ApiError(400,'All fields are required'));
    }

    const school = await School.findById(schoolId);
    if (!school) {
        return next(new ApiError(404,'School not found'));
    }

    if (school.principal) {
        return next(new ApiError(400,'School already has a principal'));
    }

    const existingUser = await User.findOne({email});
    if (existingUser) {
        return next(new ApiError(400,'User with this email already exists'));
    }

    const newPrincipal = new User({
        name,
        email,
        phone,
        school: schoolId,
        password,
        role: 'Principal'
    });
    await newPrincipal.save();

    school.principal = newPrincipal._id;
    await school.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principal added successfully',
            {name, email, phone, schoolId}
        )
    )
});

export const editPrincipal = asyncHandler(async (req, res, next) => {
    const {schoolCode} = req.params;
    console.log(schoolCode);
    const {name, email, phone} = req.body;

    const school = await School.findOne({schoolCode: schoolCode}).populate('principal');
    if (!school) {
        return next(new ApiError(404,'School not found'));
    }
    const principal = school.principal;
    if (!principal) {
        return next(new ApiError(404,'Principal not found'));
    }
    principal.name = name || principal.name;
    principal.email = email || principal.email;
    principal.phone = phone || principal.phone;
    await principal.save();
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principal updated successfully',
            {name, email, phone}
        )
    )
});

export const resetPrincipalPassword = asyncHandler(async (req, res, next) => {
    const {schoolCode} = req.params;
    const {password} = req.body;

    if (!password) {
        return next(new ApiError(400,'Password is required'));
    }

    const school = await School.findOne({schoolCode}).populate('principal');
    if (!school) {
        return next(new ApiError(404,'School not found'));
    }

    const principal = school.principal;
    if (!principal) {
        return next(new ApiError(404,'Principal not found'));
    }

    principal.password = password;
    await principal.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Password reset successfully'
        )
    )
});

export const assignNewPrincipal = asyncHandler(async (req, res, next) => {
    const {schoolCode} = req.params;
    const {name, email, phone, password} = req.body;
    if (!name || !email || !phone || !password) {
        return next(new ApiError(400,'All fields are required'));
    }
    const school = await School.findOne({schoolCode});
    if (!school) {
        return next(new ApiError(404,'School not found'));
    }

    const oldPrincipalId = school.principal;
    if (oldPrincipalId) {
        await User.findByIdAndDelete(oldPrincipalId);
    }

    const existingUser = await User.findOne({email});
    if (existingUser) {
        return next(new ApiError(400,'User with this email already exists'));
    }
    const newPrincipal = new User({
        name,
        email,
        phone,
        school: school._id,
        password,
        role: 'Principal'
    });
    await newPrincipal.save();
    school.principal = newPrincipal._id;
    await school.save();
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principal reassigned successfully',
            {name, email, phone}
        )
    )
});

export const updatePrincipal = asyncHandler(async (req, res, next) => {
    const {principalId} = req.params;
    const {name, email, phone, gender} = req.body;

    const principal = await User.findById(principalId); 
    if (!principal) {
        return next(new ApiError(404,'Principal not found'));
    }
    principal.name = name || principal.name;
    principal.email = email || principal.email;
    principal.phone = phone || principal.phone;
    principal.gender = gender || principal.gender;
    await principal.save();
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principal updated successfully',
            {name  , email, phone, gender}
        )
    )
});

export const deletePrincipal = asyncHandler(async (req, res, next) => {
    const {principalId} = req.params;
    const principal = await User.findById(principalId);
    if (!principal) {
        return next(new ApiError(404,'Principal not found'));
    }
    const school = await School.findById(principal.school);
    if (school) {
        school.principal = null;
        await school.save();
    }
    await User.findByIdAndDelete(principalId);
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Principal deleted successfully'
        )
    )
});