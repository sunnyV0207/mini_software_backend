import {Router} from 'express';
import { loginUser } from '../controllers/user.controller.js';

const router = Router();

// Example route handlers
router.get('/', (req, res) => {
    res.send('Get all users');
});
router.route('/login').post(loginUser)

export default router;