import {Router} from 'express';
import { sendotp } from '../controllers/auth.controller.js';

const router = Router();

router.route('/send-otp').post(sendotp)

export default router;