import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import User from '../models/user.model.js';
import School from '../models/school.model.js';
import transporter from '../utilities/sendMail.js';

// Controller to send OTP for password reset
export const sendOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    console.log(email);
    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(404, 'User with this email does not exist'));
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
    // Save OTP and its expiration time to the user's record in the database
    user.otp = otp;
    user.otpExpiration = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
    await user.save();
    
    // Logic to generate and send OTP goes here
    const mailOptions = {
        from: process.env.mail_sender,
        to: email,
        subject: 'Your OTP for Password Reset',
        html: `<p>Your One time password for reset password is <b>${otp}</b></p>`,
    };

    await transporter.sendMail(mailOptions);

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'OTP sent successfully to the registered email',
            {}
        )
    );
})

export const verifyOtp = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    // console.log(otp)
    // console.log(typeof otp)

    if(!email || email==="" || !otp) {
        return next(new ApiError(400, 'Email and OTP are required'));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(404, 'User with this email does not exist'));
    }
    // console.log(user.otp)
    // console.log(typeof user.otp)
    if (String(user.otp) !== String(otp) || Date.now() > new Date(user.otpExpiration).getTime()) {
        return next(new ApiError(400, 'Invalid or expired OTP'));
    }

    // OTP is valid
    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'OTP verified successfully',
            {}
        )
    );
})

export const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, newPassword } = req.body;
    if(!email || email==="" || !newPassword || newPassword==="") {
        return next(new ApiError(400, 'Email and new password are required'));
    }
    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(404, 'User with this email does not exist'));
    }
    user.password = newPassword;
    await user.save();
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Password reset successfully',
            {}
        )
    );
});

export const stats = asyncHandler(async (req, res, next) => {
    // Logic to gather statistics goes here
    const SuperAdminCount = await User.countDocuments({role: 'Super Admin'});
    const PrincipalCount = await User.countDocuments({role: 'Principal'});
    const SchoolCount = await School.countDocuments();
    const TeacherCount = await User.countDocuments({role: 'Teacher'});
    const StudentCount = await User.countDocuments({role: 'Student'});
    const ParentCount = await User.countDocuments({role: 'Parent'});
    // Add more statistics as needed
    const statistics = {
        SuperAdminCount,
        PrincipalCount,
        SchoolCount,
        TeacherCount,
        StudentCount,
        ParentCount
    };
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Statistics fetched successfully',
            statistics
        )
    );
});