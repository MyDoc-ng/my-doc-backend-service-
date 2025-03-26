import multer from "multer";
import path from "path";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the uploads directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const cleanFileName = file.originalname.replace(/\s+/g, "_"); 
    cb(null, `${uniqueSuffix}-${cleanFileName}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestException("Only .jpeg, .jpg, and .png files are allowed", ErrorCode.BADREQUEST));
  }
};

export const upload = multer({ storage, fileFilter });
