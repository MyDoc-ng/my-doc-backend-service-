import { z } from "zod";
import { chatSchema, voiceMessageSchema } from "../schema/chatValidation.schema";

export type ChatMessageData = z.infer<typeof chatSchema>;
export type VoiceMessageData = z.infer<typeof voiceMessageSchema>;