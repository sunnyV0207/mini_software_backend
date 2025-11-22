import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import User from '../models/user.model.js';

// Controller to send OTP for password reset
export const sendOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(404, 'User with this email does not exist'));
    }
    // Logic to generate and send OTP goes here
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