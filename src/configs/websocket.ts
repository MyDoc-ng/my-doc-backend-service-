import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "../prisma/prisma";
import { z } from "zod";
import { Server } from "http";
import { chatSchema } from "../schema/chatValidation.schema";
import logger from "../logger";
import { checkIfUserExists } from "../utils/checkIfUserExists";


// Store connected clients
export const clients = new Map<string, WebSocket>();

export const setupWebSocket = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        logger.info("New WebSocket connection");

        ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString());

                // Validate message data
                const validatedMessage = chatSchema.parse(message);

                const senderExists = await checkIfUserExists(validatedMessage.senderId, validatedMessage.senderType);
                if (!senderExists) {
                    logger.error("Sender not found");

                    ws.send(
                        JSON.stringify({
                            error: "Sender not found",
                        })
                    );
                    // throw new NotFoundException("Sender not found", ErrorCode.NOTFOUND);
                }

                // Check if receiver exists
                const receiverExists = await checkIfUserExists(validatedMessage.receiverId, validatedMessage.receiverType);
                if (!receiverExists) {
                    logger.error("Receiver not found");

                    ws.send(
                        JSON.stringify({
                            error: "Receiver not found",
                        })
                    );
                    // throw new NotFoundException("Receiver not found", ErrorCode.NOTFOUND);
                }
                // Save message to database
                const newMessage = await prisma.chatMessage.create({
                    data: {
                        senderId: validatedMessage.senderId,
                        senderType: validatedMessage.senderType,
                        receiverId: validatedMessage.receiverId,
                        receiverType: validatedMessage.receiverType,
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
                logger.error("Error processing message:", {
                    error: error
                });
                ws.send(
                    JSON.stringify({
                        error: error instanceof z.ZodError ? error.errors : "Failed to send message",
                    })
                );
            }
        });

        ws.on("close", () => {
            logger.info("WebSocket disconnected");
        });
    });

    logger.info("WebSocket server running...");
};
