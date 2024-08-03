import { Router } from "express";
import { UserRegister } from "../controller/User.js";

const router = Router()

router.route("/register").post(UserRegister)

export default router