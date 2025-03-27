import { NotificationType } from "@prisma/client";
import { prisma } from "../prisma/prisma";

export class NotificationService {
    // Get notifications for a User
    static async getNotifications(recipientId: string) {
        return await prisma.notification.findMany({
            where: { recipientId },
            orderBy: { createdAt: "desc" }
        });
    }

    // Mark a single notification as read
    static async markAsRead(notificationId: string) {
        return await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
    }

    // Mark all notifications as read for a user
    static async markAllAsRead(recipientId: string) {
        return await prisma.notification.updateMany({
            where: { recipientId, isRead: false },
            data: { isRead: true }
        });
    }

    // Create a notification for a user
    static async createNotification(recipientId: string, title: string, message: string, type: NotificationType) {
        return await prisma.notification.create({
            data: { title, message, recipientId, type }
        });
    }

}
