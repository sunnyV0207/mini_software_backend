import {Router} from 'express';
import { sendOtp } from '../controllers/auth.controller.js';
import { verifyOtp } from '../controllers/auth.controller.js';
import { resetPassword } from '../controllers/auth.controller.js';
import { stats } from '../controllers/auth.controller.js';

const router = Router();

router.route('/send-otp').post(sendOtp)
router.route('/verify-otp').post(verifyOtp)
router.route('/reset-password').post(resetPassword)
router.route('/stats').get(stats)

export default router;