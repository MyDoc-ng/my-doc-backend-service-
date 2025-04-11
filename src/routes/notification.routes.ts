import express, { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { NotificationController } from "../controller/notification.controller";

const router: Router = express.Router();

//! Notification Endpoints
router.get("/notifications", authenticate, NotificationController.getNotifications);
router.patch("/notifications/:id/read", authenticate, NotificationController.markNotificationAsRead);
router.patch("/notifications/read-all", authenticate, NotificationController.markAllNotificationsAsRead);

export default router;