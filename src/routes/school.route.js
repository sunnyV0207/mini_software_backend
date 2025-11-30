import {Router} from 'express';
import {addSchool} from '../controllers/school.controller.js';
import {fetchSchools} from '../controllers/school.controller.js';
import {getSchoolByCode} from '../controllers/school.controller.js';
import {editSchool} from '../controllers/school.controller.js';
import {editSchoolStatus} from '../controllers/school.controller.js';
import {getSchool} from '../controllers/school.controller.js';
import {addClass} from '../controllers/school.controller.js';
import {addTeacher} from '../controllers/school.controller.js';

const router = Router();

// Example route handlers all users
router.route('/add-school').post(addSchool)
router.route('/fetch-schools').get(fetchSchools)
router.route('/:schoolCode').get(getSchoolByCode)
router.route('/:schoolCode/edit').put(editSchool) // Reusing addSchool controller for editing
router.route('/update-school-status/:schoolId').patch(editSchoolStatus) // Reusing addSchool controller for deactivating
router.route('/:schoolId/get-school').get(getSchool)
router.route("/:schoolCode/add-class").post(addClass)
router.route("/:schoolCode/add-teacher").post(addTeacher)

export default router;