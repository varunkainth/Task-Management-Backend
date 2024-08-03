import { Router } from "express";
import AdminCheck from "../middleware/CheckAdmin.js";
import {
  deleteProject,
  getAllProject,
  getProjectById,
  ProjectCreate,
  updateProject,
} from "../controller/Project.js";

const router = Router();

router.route("/all").get(AdminCheck, getAllProject);
router.route("/update/:id").patch(AdminCheck, updateProject);
router.route("/delete/:id").delete(AdminCheck, deleteProject);
router.route("/create").post(ProjectCreate);
router.route("/detail/:id").get(AdminCheck, getProjectById);

export default router;
