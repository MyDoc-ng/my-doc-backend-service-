import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";

export class NotificationController {

    static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const recipientId = req.user!.id;

            const notifications = await NotificationService.getUserNotifications(recipientId);
            res.status(200).json(notifications);
        } catch (error) {
            next(error);
        }
    }

    // Mark a single notification as read
    static async markUserNotificationAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await NotificationService.markAsRead(id);
            res.status(200).json({ message: "Notification marked as read" });
        } catch (error) {
            next(error);
        }
    }

    // Mark all notifications as read for a recipient
    static async userMarkAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const recipientId = req.user!.id;

            await NotificationService.userMarkAllAsRead(recipientId);
            res.status(200).json({ message: "All notifications marked as read" });
        } catch (error) {
            next(error);
        }
    }
}
