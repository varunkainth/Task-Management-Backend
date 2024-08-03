import { Router } from "express";
import TokenVerify from "../middleware/TokenVerification.js";
import { UserLogin, UserLogout, UserRegister } from "../controller/Auth.js";

const router = Router();

router.route("/register").post(UserRegister);
router.route("/login").post(UserLogin);
router.route("/logout").get(TokenVerify, UserLogout);

export default router;
