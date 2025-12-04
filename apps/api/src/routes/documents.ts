/**
 * Document upload and extraction routes
 * Handles file uploads (images + PDFs) and provides extraction endpoints
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for memory storage (no disk writes for privacy)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed.'));
    }
  },
});

// Single file upload middleware
export const uploadMiddleware = upload.single('document');

/**
 * Document upload endpoint
 * Accepts images and PDFs, returns extraction status
 */
export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a document file (image or PDF)',
      });
      return;
    }

    const file = req.file;
    const documentType = req.body.documentType || 'unknown';

    // Log upload info (no file content logged for privacy)
    console.log(`Document upload: ${file.originalname}, type: ${file.mimetype}, size: ${file.size} bytes`);

    // For MVP: Return success with partial extraction guidance
    // In production, this would call OCR service
    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      fileInfo: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        documentType,
      },
      extraction: {
        status: 'pending',
        message: 'Extraction should be performed client-side for privacy. Use the extraction utilities in the wallet app.',
      },
      note: 'For privacy, document processing is recommended client-side. This endpoint accepts files but extraction happens in the browser.',
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    
    // Provide friendly error messages
    if (error.message && error.message.includes('Invalid file type')) {
      res.status(400).json({
        error: 'Invalid file type',
        message: 'Only images (JPEG, PNG, WebP) and PDF files are supported.',
      });
      return;
    }
    
    if (error.message && error.message.includes('File too large')) {
      res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB.',
      });
      return;
    }

    res.status(500).json({
      error: 'Upload failed',
      message: 'Unable to process document upload. Please try again or use client-side extraction.',
    });
  }
}

/**
 * Health check for document service
 */
export async function documentHealth(req: Request, res: Response): Promise<void> {
  res.json({
    status: 'ok',
    service: 'document-upload',
    supportedFormats: ['JPEG', 'PNG', 'WebP', 'PDF'],
    maxFileSize: '10MB',
  });
}

