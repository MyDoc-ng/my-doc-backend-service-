import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";

export class NotificationController {

    static async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const recipientId = req.user!.id;

            const result = await NotificationService.getNotifications(recipientId);
            res.status(result.status ?? 200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // Mark a single notification as read
    static async markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await NotificationService.markAsRead(id);
            res.status(result.status ?? 200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // Mark all notifications as read for a recipient
    static async markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const recipientId = req.user!.id;

            const notifications = await NotificationService.markAllAsRead(recipientId);
            res.status(notifications.status ?? 200).json(notifications);
        } catch (error) {
            next(error);
        }
    }
}
