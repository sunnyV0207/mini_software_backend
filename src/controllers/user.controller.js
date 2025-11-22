import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import User from '../models/user.model.js';

// Controller to handle user login
export const loginUser = asyncHandler(async (req, res, next) => {
    const {email,password} = req.body;
    // console.log(email, password);
    const user = await User.findOne({ email }).select('+password');
    // console.log(user)
    if (!user) {
        return next(new ApiError(401,'Invalid email'));
    }

    const passwordMatch = await user.isPasswordCorrect(password);
    if (!passwordMatch) {
        return next(new ApiError(401,'Invalid password'));
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'User logged in successfully',
            {user}
        )
    )
});