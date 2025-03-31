import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";

export class NotificationController {

    static async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const recipientId = req.user!.id;

            const notifications = await NotificationService.getNotifications(recipientId);
            res.status(200).json(notifications);
        } catch (error) {
            next(error);
        }
    }

    // Mark a single notification as read
    static async markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await NotificationService.markAsRead(id);
            res.status(200).json({ message: "Notification marked as read" });
        } catch (error) {
            next(error);
        }
    }

    // Mark all notifications as read for a recipient
    static async markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const recipientId = req.user!.id;

            await NotificationService.markAllAsRead(recipientId);
            res.status(200).json({ message: "All notifications marked as read" });
        } catch (error) {
            next(error);
        }
    }
}
