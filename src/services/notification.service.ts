import { NotificationType, RecipientType } from "@prisma/client";
import { prisma } from "../prisma/prisma";

export class NotificationService {
    // Get notifications for a User
    static async getUserNotifications(recipientId: string) {
        return await prisma.notification.findMany({
            where: { recipientId, recipientType: RecipientType.USER },
            orderBy: { createdAt: "desc" }
        });
    }

    static async getAdminNotifications(recipientId: string, recipientType: RecipientType) {
        return await prisma.notification.findMany({
            where: { recipientId, recipientType },
            orderBy: { createdAt: "desc" }
        });
    }

    static async getDoctorNotifications(recipientId: string, recipientType: RecipientType) {
        return await prisma.notification.findMany({
            where: { recipientId, recipientType },
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

    // Mark all notifications as read for a recipient
    static async userMarkAllAsRead(recipientId: string) {
        return await prisma.notification.updateMany({
            where: { recipientId, recipientType: RecipientType.USER, isRead: false },
            data: { isRead: true }
        });
    }

    static async doctorMarkAllAsRead(recipientId: string, recipientType: RecipientType) {
        return await prisma.notification.updateMany({
            where: { recipientId, recipientType, isRead: false },
            data: { isRead: true }
        });
    }

    static async adminMarkAllAsRead(recipientId: string, recipientType: RecipientType) {
        return await prisma.notification.updateMany({
            where: { recipientId, recipientType, isRead: false },
            data: { isRead: true }
        });
    }

    // Create a notification for a user
    static async createUserNotification(recipientId: string, title: string, message: string, type: NotificationType) {
        return await prisma.notification.create({
            data: { recipientId, recipientType: RecipientType.USER, title, message, type }
        });
    }

    // Create a notification for a user
    static async createDoctorNotification(recipientId: string, title: string, message: string, type: NotificationType) {
        return await prisma.notification.create({
            data: { recipientId, recipientType: RecipientType.DOCTOR, title, message, type }
        });
    }

    // Create a notification for a user
    static async createAdminNotification(recipientId: string, title: string, message: string, type: NotificationType) {
        return await prisma.notification.create({
            data: { recipientId, recipientType: RecipientType.ADMIN, title, message, type }
        });
    }
}
