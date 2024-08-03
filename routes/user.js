import { Router } from "express";
import {
  DeleteUser,
  UpdateDeatils,
  UpdatePassword,
  updateProfilePic,
} from "../controller/User.js";
import TokenVerify from "../middleware/TokenVerification.js";
import upload from "../middleware/multer.js";

const router = Router();


router.route("/update/details").patch(TokenVerify, UpdateDeatils);
router.route("/update/password").patch(TokenVerify, UpdatePassword);
router
  .route("/update/profilepic")
  .patch(TokenVerify, upload.single("profilePic"), updateProfilePic);
router.route("/delete").delete(TokenVerify, DeleteUser);

export default router;
