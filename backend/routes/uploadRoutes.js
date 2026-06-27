import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

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

    // Return uploaded file metadata
    return res.status(200).json({
      success: true,
      message: 'File uploaded and verified by upload gateway',
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
