import { Router } from "express";
import {
  addStudent,
  getStudent,
  editStudent,
  updateStudentStatus,
  getStudentsBySchool,
  deleteStudent,
} from "../controllers/student.controller.js";

const router = Router();

// Create student (with or without schoolCode param)
router.route("/add-student").post(addStudent);
router.route("/:schoolCode/add-student").post(addStudent);

// Get single student
router.route("/:studentId/get-student").get(getStudent);
router.route("/:studentId").get(getStudent);

// Edit student
router.route("/:studentId/edit-student").post(editStudent);
router.route("/:studentId/edit").put(editStudent);

// Update status (Active/Inactive)
router.route("/update-student-status/:studentId").patch(updateStudentStatus);
router.route("/:studentId/update-status").patch(updateStudentStatus);

// List students for a school
router.route("/:schoolCode/get-students").get(getStudentsBySchool);

// Delete student
router.route("/:studentId").delete(deleteStudent);

export default router;
