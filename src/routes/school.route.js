import {Router} from 'express';
import {addSchool} from '../controllers/school.controller.js';
import {fetchSchools} from '../controllers/school.controller.js';
import {getSchoolByCode} from '../controllers/school.controller.js';
import {editSchool} from '../controllers/school.controller.js';

const router = Router();

// Example route handlers all users
router.route('/add-school').post(addSchool)
router.route('/fetch-schools').get(fetchSchools)
router.route('/:schoolCode').get(getSchoolByCode)
router.route('/:schoolCode/edit').put(editSchool) // Reusing addSchool controller for editing

export default router;