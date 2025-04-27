import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "../prisma/prisma";
import jwt from "jsonwebtoken";
import { Server } from "http";
import { chatSchema } from "../schema/chat.schema";
import logger from "../logger";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { UserTypes } from "@prisma/client";

const SECRET_KEY = process.env.JWT_SECRET as string;

export const clients = new Map<string, WebSocket>();

export const setupWebSocket = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws, req) => {
        const token = req.headers.authorization;

        if (!token) {
            ws.close(); 
            return;
        }

        try {
            const decoded: any = jwt.verify(token, SECRET_KEY);
            if (!decoded || !decoded.id) {
                ws.close();
                return;
            }

            const userId = decoded.id;
            const userRole = decoded.role;
            logger.info(`User ${userId} with the role of ${userRole} connected`);

            clients.set(userId, ws);

            // If the user is a doctor, mark them as online
            if (userRole === UserTypes.DOCTOR) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: true },
                });
            }

            ws.on("message", async (data) => {
                try {
                    const message = JSON.parse(data.toString());

                    // Validate message data
                    const validatedMessage = chatSchema.parse(message);

                    // Check if sender exists
                    const senderExists = await checkIfUserExists(validatedMessage.senderId);
                    if (!senderExists) {
                        ws.send(JSON.stringify({ error: "Sender not found" }));
                        return;
                    }

                    // Check if receiver exists
                    const receiverExists = await checkIfUserExists(validatedMessage.receiverId);
                    if (!receiverExists) {
                        ws.send(JSON.stringify({ error: "Receiver not found" }));
                        return;
                    }

                    // Save message to database
                    const newMessage = await prisma.chatMessage.create({
                        data: {
                            senderId: validatedMessage.senderId,
                            // senderType: validatedMessage.senderType,
                            receiverId: validatedMessage.receiverId,
                            // receiverType: validatedMessage.receiverType,
                            content: validatedMessage.content,
                        },
                    });

                    // Send real-time update to the receiver if online
                    const receiverSocket = clients.get(validatedMessage.receiverId);
                    if (receiverSocket) {
                        receiverSocket.send(JSON.stringify(newMessage));
                    }

                    // Acknowledge sender
                    ws.send(JSON.stringify({ success: true, message: newMessage }));
                } catch (error) {
                    logger.error("Error processing message:", { error });
                    ws.send(JSON.stringify({ error: "Failed to send message" }));
                }
            });

            ws.on("close", async () => {
                logger.info(`User ${userId} with the role of ${userRole} disconnected`);

                clients.delete(userId);

                // If the user is a doctor, update last active timestamp and mark offline
                if (userRole === UserTypes.DOCTOR) {
                    await prisma.user.update({
                        where: { id:userId },
                        data: { isOnline: false, lastActive: new Date() },
                    });
                }
            });
        } catch (error) {
            console.log("Invalid token:", error);
            ws.close(); 
        }
    });

    console.log("WebSocket server running...");
};
