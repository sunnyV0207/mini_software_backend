import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import School from '../models/school.model.js';
import Class from '../models/class.model.js'
import User from '../models/user.model.js'
import mongoose from 'mongoose';

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
    const {schoolName, schoolCode, address, contactNumber, email} = req.body;
    if (!schoolName || !schoolCode || !address || !contactNumber || !email) {
        return next(new ApiError(400,'All fields are required'));
    }

    const existingSchool = await School.findOne({$or: [{email},{schoolCode}]});
    if (existingSchool) {
        return next(new ApiError(400,'School with this email or code already exists'));
    }

    const newSchool = new School({
        schoolName,
        schoolCode,
        address,
        contactNumber,
        email
    });

    await newSchool.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'School added successfully',
            {schoolName, address, contactNumber,email}
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

export const getSchool = asyncHandler(async (req, res, next) => {
    const {schoolId} = req.params;
    console.log(schoolId);

    // Validate Mongo ID
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        return next(new ApiError(400, "Invalid school ID"));
    }


    const school = await School.findById(schoolId).select('-__v -createdAt -updatedAt');
    if (!school) {
        return next(new ApiError(404, 'School not found'));
    }
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'School fetched successfully',
            school
        )
    )
});

export const addClass = asyncHandler(async(req,res,next)=>{
    const {schoolCode} = req.params;
    // console.log(schoolCode);

    if(!schoolCode){
        return next(new ApiError(401,"School Code is required"))
    }

    const school = await School.findOne({schoolCode});
    if(!school){
        return next(new ApiError(402,"School not defined"))
    }

    const {classNumber,section,subjects} = req.body;
    // console.log(classNumber,section,subjects)

    if(!classNumber || !section || !subjects){
        return next(new ApiError(400,"All fields are required"))
    }

    if(subjects.length === 0){
        return next(new ApiError(402,"Subjects array can't be empty"))
    }

    const existingClass = await Class.findOne({classNumber,section,school: school._id})
    if(existingClass){
        return next(new ApiError(402,"Class already exists for this school"))
    }

    const newClass = new Class({
        classNumber,
        section,
        subjects,
        school
    })
    await newClass.save()

    school.classes.push(newClass._id);
    await school.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Class added successfully",
            newClass
        )
    )

})

export const addTeacher = asyncHandler(async(req,res,next)=>{
    const {schoolCode} = req.params;

    if(!schoolCode){
        return next(new ApiError(401,"School code is required"))
    }

    const school = await School.findOne({schoolCode})
    if(!school){
        return next(new ApiError(401,"School is not defined"))
    }

    const {assignedClass, assignedSection, fullName, email, password, confirmPassword, phone, gender} = req.body;

    console.log(req.body)
    
    if(!assignedClass || !assignedSection || !fullName || !email || !password || !confirmPassword || !phone || !gender ){
        return next(new ApiError(401,"All fields are required"))
    }

    const existingClass = await Class.findOne({
        classNumber: assignedClass,
        section: assignedSection,
        school: school._id
    })

    if(!existingClass){
        return next(new ApiError(402,"This class do not exists for this school"))
    }

    if(existingClass.classTeacher){
        return next(new ApiError(400,"This class has already been assigned a teacher"))
    }

    const existingUser = await User.findOne({email})
    if(existingUser){
        return next(new ApiError(402,"User with email already exists. Try another email address"))
    }

    const newUser = await User.create({
        name: fullName,
        email,
        phone,
        password,
        gender,
        role: "Teacher",
        school: school._id,
        class: existingClass
    })

    school.teachers.push(newUser._id)
    await school.save()
    existingClass.classTeacher = newUser._id
    await existingClass.save()

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Teacher added successfully",
            newUser
        )
    )
})

export const getTeachers = asyncHandler( async (req,res,next) => {
    const {schoolCode} = req.params;
    // console.log(schoolCode)

    if(!schoolCode){
        return next(new ApiError(401,"School code is required"))
    }

    const school = await School.findOne({schoolCode}).populate(({path:"teachers",populate:{path:"class"}}))
    if(!school){
        return next(new ApiError(401,"School not found"))
    }

    const teachers = school.teachers;
    // console.log(teachers)

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Techares fetched successfully",
            teachers
        )
    )
} )

export const fetchClasses = asyncHandler( async(req,res,next)=>{
    const {schoolCode} = req.params;
    if(!schoolCode){
        return next(new ApiError(401,"School code is required"))
    }

    const school = await School.findOne({schoolCode}).populate({path:'classes',populate:{path:'classTeacher',model:'User'}})
        
    if(!school){
        return next(new ApiError(400,"No school found"))
    }

    // console.log(JSON.stringify(school,null,2))
    // console.log(school.classes)

    const classes = school.classes

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "classes fetched successfully",
            classes
        )
    )
} )