import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import * as Sentry from '@sentry/node';

const router = express.Router();

/**
 * @desc    Upload document file
 * @route   POST /upload/docs
 * @access  Private
 */
router.post('/docs', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a document file to upload' });
    }

    return res.status(200).json({
      success: true,
      message: 'File uploaded and verified by upload gateway',
      file: {
        name: req.file.originalname,
        secureUrl: req.file.path,
        publicId: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'
      }
    });
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}, handleUploadError); // catches multer errors (size limit, bad MIME type)

export default router;

