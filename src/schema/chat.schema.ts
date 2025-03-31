import { z } from "zod";

export const chatSchema = z.object({
    senderId: z.string()
        .min(1, "Sender ID cannot be empty"),
    receiverId: z.string()
        .min(1, "Receiver ID cannot be empty"),
    content: z.string().min(1, "Message cannot be empty"),
});

export const voiceMessageSchema = z.object({
    senderId: z.string().uuid(),
    receiverId: z.string().uuid(),
    voiceUrl: z.string(), // This will be generated dynamically
  });
