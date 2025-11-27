import {Router} from 'express';
import { loginUser } from '../controllers/user.controller.js';
import { contact } from '../controllers/user.controller.js';

const router = Router();

// Example route handlers
router.get('/', (req, res) => {
    res.send('Get all users');
});
router.route('/login').post(loginUser)
router.route('/contact').post(contact)

export default router;