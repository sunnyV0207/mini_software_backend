import { Router } from "express";
import { getTeacher, editTeacher, updateTeacherStatus, getMyClass } from '../controllers/teacher.controller.js'

const router = Router()

router.route('/:teacherId/get-teacher').get(getTeacher)
router.route('/:teacherId/my-class').get(getMyClass)
router.route('/:teacherId/edit-teacher').post(editTeacher)
router.route('/update-teacher-status/:teacherId').patch(updateTeacherStatus)

export default router;