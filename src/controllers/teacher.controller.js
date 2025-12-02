import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import School from '../models/school.model.js';
import Class from '../models/class.model.js'
import User from '../models/user.model.js'
import mongoose from 'mongoose';

export const getTeacher = asyncHandler( async( req,res,next ) =>{
    const {teacherId} = req.params;
    if(!teacherId){
        return next(new ApiError(401,"Teacher Id is required"))
    }

    const existingTeacher = await User.findById(teacherId).populate('class')
    // console.log(existingTeacher)
    if(!existingTeacher){
        return next(new ApiError(402,"Teacher not exists"))
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Teacher fetched successfully",
            existingTeacher
        )
    )
})


export const editTeacher = asyncHandler( async( req,res,next )=>{
    const {teacherId} = req.params;
    // console.log(teacherId)

    if(!teacherId){
        return next(new ApiError(400,"Teacher id is required"))
    }

    const teacher = await User.findById(teacherId).populate('school')
    // console.log(teacher)

    if(!teacher){
        return next(new ApiError(401,"The teacher do not exists to edit"))
    }

    // console.log(req.body)

    const {fullName, email, gender, phone} = req.body
    if(!fullName || !email || !phone || !gender){
        return next(new ApiError(401,"All fields are required"))
    }

    if(teacher.email !== email){
        const existingUserWithEmail = await User.findOne({email})
        if(existingUserWithEmail){
            return next(new ApiError(402,"The email you entered is already in use."))
        }
    }

    teacher.name = fullName || teacher.name
    teacher.email = email || teacher.email
    teacher.phone = phone || teacher.phone
    teacher.gender = gender || teacher.gender

    await teacher.save()

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Teacher edited successfully",
            teacher
        )
    )

} )

export const updateTeacherStatus = asyncHandler(async(req,res,next)=>{
    const {teacherId} = req.params;

    if(!teacherId){
        return next(new ApiError(401,"Teacher id is required"))
    }

    const teacher = await User.findById(teacherId)
    if(!teacher){
        return next(new ApiError(402,"Teacher do not exists"))
    }

    teacher.status = teacher.status === "Active" ? "Inactive" : "Active";
    await teacher.save()

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Taecher status updated successfully",
            teacher
        )
    )
})