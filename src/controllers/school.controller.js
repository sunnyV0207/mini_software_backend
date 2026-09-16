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

export const fetchClasses = asyncHandler( async(req, res, next) => {
    const { schoolCode } = req.params;
    if (!schoolCode) {
        return next(new ApiError(401, "School code is required"));
    }

    const school = await School.findOne({ schoolCode }).populate({
        path: 'classes',
        populate: [
            { path: 'classTeacher', model: 'User', select: 'name email phone status' },
            { path: 'students', model: 'User', select: 'name email phone gender rollNumber status' }
        ]
    });
        
    if (!school) {
        return next(new ApiError(404, "School not found"));
    }

    const classesWithStats = (school.classes || []).map((cls) => {
        const clsObj = cls.toObject ? cls.toObject() : cls;
        const studentList = clsObj.students || [];
        const boys = studentList.filter((s) => s && s.gender === 'Male').length;
        const girls = studentList.filter((s) => s && s.gender === 'Female').length;
        const others = studentList.filter((s) => s && (s.gender === 'Other' || s.gender === 'Others')).length;

        return {
            ...clsObj,
            boys,
            girls,
            others,
            totalStudents: studentList.length,
            attendance: clsObj.attendance || 85,
        };
    });

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "classes fetched successfully",
            classesWithStats
        )
    );
});

export const getStudents = asyncHandler( async (req, res, next) => {
    const { schoolCode } = req.params;

    if (!schoolCode) {
        return next(new ApiError(401, "School code is required"));
    }

    const school = await School.findOne({ schoolCode }).populate({
        path: "students",
        populate: { path: "class" }
    });

    if (!school) {
        return next(new ApiError(404, "School not found"));
    }

    const students = school.students || [];

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Students fetched successfully",
            students
        )
    );
});

export const getParents = asyncHandler( async (req, res, next) => {
    const { schoolCode } = req.params;

    if (!schoolCode) {
        return next(new ApiError(401, "School code is required"));
    }

    const school = await School.findOne({ schoolCode }).populate({
        path: "parents",
        populate: {
            path: "children",
            populate: { path: "class" }
        }
    });

    if (!school) {
        return next(new ApiError(404, "School not found"));
    }

    const parents = school.parents || [];

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Parents fetched successfully",
            parents
        )
    );
});

export const getClassById = asyncHandler(async (req, res, next) => {
    const { classId } = req.params;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return next(new ApiError(400, "Valid Class ID is required"));
    }

    const targetClass = await Class.findById(classId)
        .populate("classTeacher", "name email phone")
        .populate("students", "name email rollNumber gender")
        .populate("school", "schoolName schoolCode");

    if (!targetClass) {
        return next(new ApiError(404, "Class not found"));
    }

    res.status(200).json(new ApiResponse(200, "Class fetched successfully", targetClass));
});

export const editClass = asyncHandler(async (req, res, next) => {
    const { classId } = req.params;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
        return next(new ApiError(400, "Valid Class ID is required"));
    }

    const targetClass = await Class.findById(classId);
    if (!targetClass) {
        return next(new ApiError(404, "Class not found to edit"));
    }

    const { classNumber, section, subjects, classTeacher } = req.body;

    if (classNumber && section && (Number(classNumber) !== targetClass.classNumber || section.trim() !== targetClass.section)) {
        const existingClass = await Class.findOne({
            classNumber: Number(classNumber),
            section: section.trim(),
            school: targetClass.school,
            _id: { $ne: classId }
        });
        if (existingClass) {
            return next(new ApiError(400, "Another class with this class number and section already exists in this school."));
        }
        targetClass.classNumber = Number(classNumber);
        targetClass.section = section.trim();
    }

    if (Array.isArray(subjects)) {
        targetClass.subjects = subjects;
    }

    if (classTeacher !== undefined) {
        if (targetClass.classTeacher && String(targetClass.classTeacher) !== String(classTeacher)) {
            await User.findByIdAndUpdate(targetClass.classTeacher, { $set: { class: null } });
        }

        if (classTeacher && mongoose.Types.ObjectId.isValid(classTeacher)) {
            targetClass.classTeacher = classTeacher;
            await User.findByIdAndUpdate(classTeacher, { $set: { class: targetClass._id } });
        } else if (!classTeacher) {
            targetClass.classTeacher = null;
        }
    }

    await targetClass.save();

    const updatedClass = await Class.findById(classId)
        .populate("classTeacher", "name email phone")
        .populate("students", "name email rollNumber gender")
        .populate("school", "schoolName schoolCode");

    res.status(200).json(new ApiResponse(200, "Class updated successfully", updatedClass));
});