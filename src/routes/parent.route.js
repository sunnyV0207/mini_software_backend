import { Router } from "express";
import {
  addParent,
  getParent,
  editParent,
  updateParentStatus,
  getParentsBySchool,
  deleteParent,
} from "../controllers/parent.controller.js";

const router = Router();

// Create parent
router.route("/add-parent").post(addParent);
router.route("/:schoolCode/add-parent").post(addParent);

// Get single parent
router.route("/:parentId/get-parent").get(getParent);
router.route("/:parentId").get(getParent);

// Edit parent
router.route("/:parentId/edit-parent").post(editParent);
router.route("/:parentId/edit").put(editParent);

// Update status
router.route("/update-parent-status/:parentId").patch(updateParentStatus);
router.route("/:parentId/update-status").patch(updateParentStatus);

// List parents for school
router.route("/:schoolCode/get-parents").get(getParentsBySchool);

// Delete parent
router.route("/:parentId").delete(deleteParent);

export default router;
