import { UserTypes } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";
import { ChatMessageData, VoiceMessageData } from "../models/chatMessage.model";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { clients } from "../configs/websocket";
import { responseService } from "./response.service";

export class ChatService {

    static async sendMessage(data: ChatMessageData) {

        const senderExists = await checkIfUserExists(data.senderId);
        if (!senderExists) {
            return responseService.notFoundError({
                message: "Sender not found",
            });
        }

        // Check if receiver exists
        const receiverExists = await checkIfUserExists(data.receiverId);
        if (!receiverExists) {
            return responseService.notFoundError({
                message: "Receiver not found",
            });
        }

        // Save message in database
        const newMessage = await prisma.chatMessage.create({
            data: data,
        });

        // Check if receiver is online via WebSocket
        const receiverSocket = clients.get(data.receiverId);
        if (receiverSocket) {
            receiverSocket.send(JSON.stringify(newMessage)); // Send message in real-time
        }

        return responseService.success({
            message: "Message sent successfully",
            data: newMessage,
        });

    }

    static async getMessages(userId: string) {

        const userExists = await checkIfUserExists(userId);
        if (!userExists) {
            return responseService.notFoundError({
                message: "User not found",
            });
        }

        const message = await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            orderBy: { createdAt: "asc" },
        });

        return responseService.success({
            message: "Messages fetched successfully",
            data: message,
        });
    }

    static async getDoctorMessages(doctorId: string) {
        return await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: doctorId },
                    { receiverId: doctorId },
                ],
            },
            orderBy: { createdAt: "asc" },
        });

    }

    static async uploadVoiceMessage(data: VoiceMessageData) {

        const senderExists = await checkIfUserExists(data.senderId);
        if (!senderExists) {
            return responseService.notFoundError({
                message: "Sender not found",
            });
        }

        // Check if receiver exists
        const receiverExists = await checkIfUserExists(data.receiverId);
        if (!receiverExists) {
            return responseService.notFoundError({
                message: "Receiver not found",
            });
        }

        const { senderId, receiverId, voiceUrl } = data;

        const newMessage = await prisma.chatMessage.create({
            data: {
                senderId,
                receiverId,
                voiceUrl: voiceUrl,
            },
        });

        // Send WebSocket notification (if receiver is online)
        const receiverSocket = clients.get(receiverId);
        if (receiverSocket) {
            receiverSocket.send(JSON.stringify(newMessage));
        }

        return responseService.success({
            message: "Chat message created Successfully",
            data: newMessage,
            status: 201
        });
    };
}
