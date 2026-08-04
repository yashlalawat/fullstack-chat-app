import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar , getMessages, sendMessage,deleteForEveryone,deleteForMe } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute , getUsersForSidebar);
router.get("/:id" ,  protectRoute , getMessages);

router.post("/send/:id", protectRoute , sendMessage);

router.patch("/delete-for-me/:id", protectRoute, deleteForMe);

router.patch(
    "/delete-for-everyone/:id",
    protectRoute,
    deleteForEveryone
);

export default router;