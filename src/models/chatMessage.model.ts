import { z } from "zod";
import { chatSchema } from "../schema/chatValidation.schema";

export type ChatMessageData = z.infer<typeof chatSchema>;