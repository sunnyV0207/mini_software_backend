import asyncHandler from '../utilities/asynchandler.js';
import ApiResponse from '../utilities/ApiResponse.js';
import ApiError from '../utilities/ApiError.js';
import User from '../models/user.model.js';
import transporter from '../utilities/sendMail.js';

export const contact = asyncHandler(async (req, res, next) => {
    const {name, email, message} = req.body;
    if (!name || !email || !message) {
        return next(new ApiError(400,'All fields are required'));
    }

    // Here you can handle the contact message, e.g., save it to the database or send an email
    // console.log(`Contact message from ${name} (${email}): ${message}`);

    const mailOptions = {
        from: process.env.MAIL_SENDER,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Contact Message',
        html: `<p>You have received a new message from <b>${name}</b> (${email}):</p><p>${message}</p>`,
    };
    await transporter.sendMail(mailOptions);

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'Contact message received successfully',
            {name, email, message}
        )
    )
});

// Controller to handle user login
export const loginUser = asyncHandler(async (req, res, next) => {
    const {email,password} = req.body;
    // console.log(email, password);
    const user = await User.findOne({ email }).select('+password').populate('school', 'schoolName schoolCode address contactNumber');
    // console.log(user)
    if (!user) {
        return next(new ApiError(401,'User with this email do not exists'));
    }

    const passwordMatch = await user.isPasswordCorrect(password);
    if (!passwordMatch) {
        return next(new ApiError(401,'Invalid password'));
    }

    const sanitizedUser = {
        ...user.toObject(),
    };
    delete sanitizedUser.password;
    delete sanitizedUser.otp;
    delete sanitizedUser.otpExpiration;
    delete sanitizedUser.password;

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            'User logged in successfully',
            {user: sanitizedUser}
        )
    )
});