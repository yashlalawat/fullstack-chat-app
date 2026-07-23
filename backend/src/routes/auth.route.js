import express from "express";
import { login, logout, signup ,updateProfile ,checkAuth } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup" ,signup );
router.post("/login" ,login);
router.post("/logout", logout)

router.put("/update-profile",protectRoute , updateProfile)
//protectRoute is a middleware
//protectRoute to check the user is login or not to update the profile

router.get("/check" , protectRoute , checkAuth);

export default router;