import { UserTypes } from "@prisma/client";
import { ErrorCode } from "../exception/base";
import { NotFoundException } from "../exception/not-found";
import { prisma } from "../prisma/prisma";
import { ChatMessageData, VoiceMessageData } from "../models/chatMessage.model";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { clients } from "../configs/websocket";

export class ChatService {

    static async sendMessage(data: ChatMessageData) {

        const senderExists = await checkIfUserExists(data.senderId);
        if (!senderExists) {
            throw new NotFoundException("Sender not found", ErrorCode.NOTFOUND);
        }

        // Check if receiver exists
        const receiverExists = await checkIfUserExists(data.receiverId);
        if (!receiverExists) {
            throw new NotFoundException("Receiver not found", ErrorCode.NOTFOUND);
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

        return newMessage;

    }

    static async getMessages(userId: string) {

        const userExists = await checkIfUserExists(userId);
        if (!userExists) {
            throw new NotFoundException("User not found", ErrorCode.NOTFOUND);
        }

        return await prisma.chatMessage.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            orderBy: { createdAt: "asc" },
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
            throw new NotFoundException("Sender not found", ErrorCode.NOTFOUND);
        }

        // Check if receiver exists
        const receiverExists = await checkIfUserExists(data.receiverId);
        if (!receiverExists) {
            throw new NotFoundException("Receiver not found", ErrorCode.NOTFOUND);
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

        return newMessage;
    };


}
