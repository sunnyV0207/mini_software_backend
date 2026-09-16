import { Router } from "express";
import {
  getExamMarksSheet,
  saveExamMarks,
  publishExamMarks,
  getCumulativeSessionSheet,
  getStudentDetailedReportCard,
} from "../controllers/marks.controller.js";

const router = Router();

router.route("/:teacherId/sheet").get(getExamMarksSheet);
router.route("/:teacherId/save").post(saveExamMarks);
router.route("/:teacherId/publish").post(publishExamMarks);
router.route("/:teacherId/cumulative").get(getCumulativeSessionSheet);
router.route("/:teacherId/student/:studentId/report-card").get(getStudentDetailedReportCard);

export default router;
