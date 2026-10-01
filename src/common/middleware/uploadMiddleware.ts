import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { AppConstants } from '../constants/AppConstants.js';
import { AppError } from '../errors/AppError.js';
import { HttpStatusCodes } from '../constants/HttpStatusCodes.js';
import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';

// ─── Cloudinary Config ───────────────────────────────────────────────────────
const useCloudinary =
  !!env.CLOUDINARY_CLOUD_NAME &&
  !!env.CLOUDINARY_API_KEY &&
  !!env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

// ─── Storage Engine ──────────────────────────────────────────────────────────
let storage: multer.StorageEngine;

if (useCloudinary) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req: Request, file: Express.Multer.File) => {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const baseName = `${file.fieldname}-${Date.now()}-${uniqueSuffix}`;
      return {
        folder: 'shaddad/uploads',
        public_id: baseName,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      };
    },
  }) as multer.StorageEngine;
} else {
  // Local disk storage for development
  const uploadsDir = path.resolve(process.cwd(), AppConstants.UPLOADS_DIR);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${Date.now()}-${uniqueSuffix}${ext}`);
    },
  });
}

// ─── File Filter ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed', HttpStatusCodes.BAD_REQUEST, 'VALIDATION_ERROR'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Extract the public URL from a multer file.
 * When using Cloudinary, file.path is the secure Cloudinary URL.
 * When using disk storage, file.path is the local filesystem path — convert to /uploads/filename.
 */
export const getFileUrl = (file: Express.Multer.File): string => {
  if (useCloudinary) {
    // multer-storage-cloudinary puts the secure URL in file.path
    return (file as any).path as string;
  }
  // Local: return a relative path the frontend can request from /uploads/
  return `/uploads/${file.filename}`;
};

/**
 * Express error-handling middleware that converts Multer errors
 * into clean 400 responses instead of falling through as 500s.
 */
export const handleUploadError = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size is 10MB.'
        : `Upload error: ${err.message}`;
    res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      message,
      errorCode: 'UPLOAD_ERROR',
    });
    return;
  }
  next(err);
};
