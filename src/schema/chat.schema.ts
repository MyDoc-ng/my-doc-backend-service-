import { z } from "zod";

export const chatSchema = z.object({
    senderId: z.string()
        .min(1, "Sender ID cannot be empty"),
    senderType: z.enum(["USER", "DOCTOR"]),
    receiverId: z.string()
        .min(1, "Receiver ID cannot be empty"),
    receiverType: z.enum(["USER", "DOCTOR"]),
    content: z.string().min(1, "Message cannot be empty"),
});

export const voiceMessageSchema = z.object({
    senderId: z.string().uuid(),
    senderType: z.enum(["USER", "DOCTOR"]),
    receiverId: z.string().uuid(),
    receiverType: z.enum(["USER", "DOCTOR"]),
    voiceUrl: z.string(), // This will be generated dynamically
  });
