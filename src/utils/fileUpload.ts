import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (to convert to base64)
const storage = multer.memoryStorage();

// File filter to only accept image files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (png, jpg, jpeg, gif, webp)'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// Convert uploaded file buffer to base64
export const fileToBase64 = (file: Express.Multer.File): string => {
  const buffer = file.buffer;
  const base64 = buffer.toString('base64');
  const mimeType = file.mimetype;
  return `data:${mimeType};base64,${base64}`;
};

