import multer from "multer";
import path from "path";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";

// Configure storage for audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/voicenotes/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Filter to accept only audio files
const audioFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /mp3|wav|ogg/; // Accept only audio files
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestException("Only .mp3, .wav, and .ogg audio files are allowed", ErrorCode.BADREQUEST));
  }
};

// Multer instance for voice messages
export const uploadVoice = multer({ storage, fileFilter: audioFileFilter });
