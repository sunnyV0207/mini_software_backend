import { Router } from "express";
import {
  getAttendanceRegister,
  saveDailyAttendance,
  completeMonthlyRegister,
  reopenMonthlyRegister,
  markAllPresentForDay,
} from "../controllers/attendance.controller.js";

const router = Router();

router.route("/:teacherId/register").get(getAttendanceRegister);
router.route("/:teacherId/save").post(saveDailyAttendance);
router.route("/:teacherId/complete").post(completeMonthlyRegister);
router.route("/:teacherId/reopen").post(reopenMonthlyRegister);
router.route("/:teacherId/mark-all-day").post(markAllPresentForDay);

export default router;
