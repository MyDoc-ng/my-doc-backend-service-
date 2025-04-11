import express, { Router } from "express";
import { validateData } from "../middleware/validation.middleware";
import { authenticate } from "../middleware/authMiddleware";
import { chatSchema } from "../schema/chat.schema";
import { UserController } from "../controller/user.controller";
import { uploadVoice } from "../middleware/uploadVoice";

const router: Router = express.Router();

//! Chat Endpoints
router.post("/chats/send", authenticate, validateData(chatSchema), UserController.sendMessage);
router.get("/chats/:userId", authenticate, UserController.getMessages);
router.post("/chats/voice", authenticate, uploadVoice.single("voice"), UserController.sendVoiceMessage);


export default router;