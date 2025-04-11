import express, { Router } from "express";
import { validateData } from "../middleware/validation.middleware";
import { updatePasswordSchema, updateProfileSchema } from "../schema/user.schema";
import { authenticate } from "../middleware/authMiddleware";
import { UserController } from "../controller/user.controller";

const router: Router = express.Router();
// ! Profile Endpoints
// router.get('/profile', authenticate, UserController.getProfile);
router.put("/profile", authenticate, validateData(updateProfileSchema), UserController.updateProfile);
//@ts-ignore
router.post("/change-password", authenticate, validateData(updatePasswordSchema), UserController.changePassword);
router.delete("/delete-account", authenticate, UserController.deleteAccount);


export default router;