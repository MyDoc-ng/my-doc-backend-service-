import multer from "multer";
import path from "path";
import fs from 'fs';

const uploadPath = "uploads/documents";
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}
// Define storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/documents");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const cleanFileName = file.originalname.replace(/\s+/g, "_");
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
    },
});

// File filter to accept only PDFs, Docs, and Images
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /pdf|doc|docx|jpeg|jpg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, DOC, DOCX, JPG, PNG files are allowed!"));
    }
};

// Define upload limits (10MB per file)
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Middleware to handle multiple files
export const uploadFiles = upload.fields([
    { name: "idDoc", maxCount: 1 },
    { name: "cvDoc", maxCount: 1 },
    { name: "medicalLicenseDoc", maxCount: 1 },
    { name: "specializationCertDoc", maxCount: 1 },
    { name: "referenceDoc", maxCount: 1 },
]);
