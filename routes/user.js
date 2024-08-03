import { Router } from "express";
import {
  UpdateDeatils,
  UpdatePassword,
  updateProfilePic,
  UserLogin,
  UserLogout,
  UserRegister,
} from "../controller/User.js";
import TokenVerify from "../middleware/TokenVerification.js";
import upload from "../middleware/multer.js";

const router = Router();

router.route("/register").post(UserRegister);
router.route("/login").post(UserLogin);
router.route("/logout").get(TokenVerify, UserLogout);
router.route("/update/details").patch(TokenVerify, UpdateDeatils);
router.route("/update/password").patch(TokenVerify, UpdatePassword);
router
  .route("/update/profilepic")
  .patch(TokenVerify, upload.single("profilePic"), updateProfilePic);

export default router;
