import { Router } from "express";
import {getTeacher} from '../controllers/teacher.controller.js'
import {editTeacher} from '../controllers/teacher.controller.js'
import {updateTeacherStatus} from '../controllers/teacher.controller.js'

const router = Router()

router.route('/:teacherId/get-teacher').get(getTeacher)
router.route('/:teacherId/edit-teacher').post(editTeacher)
router.route('/update-teacher-status/:teacherId').patch(updateTeacherStatus)

export default router;