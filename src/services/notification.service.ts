import { NotificationType } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { responseService } from "./response.service";

export class NotificationService {
    // Get notifications for a User
    static async getNotifications(recipientId: string) {
        const notification = await prisma.notification.findMany({
            where: { recipientId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        gender: true,
                        email: true,
                        phoneNumber: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return responseService.success({
            message: "Notifications fetched successfully",
            data: notification
        });
    }

    // Mark a single notification as read
    static async markAsRead(notificationId: string) {
        const notification =  await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return responseService.success({
            message: "Notification marked as read",
            data: notification
        });
    }

    // Mark all notifications as read for a user
    static async markAllAsRead(recipientId: string) {
        const notifications =  await prisma.notification.updateMany({
            where: { recipientId, isRead: false },
            data: { isRead: true }
        });

        return responseService.success({
            message: "All notifications marked as read",
            data: notifications
        });
    }

    // Create a notification for a user
    static async createNotification(recipientId: string, title: string, message: string, type: NotificationType) {
        return await prisma.notification.create({
            data: { title, message, recipientId, type }
        });
    }

}
