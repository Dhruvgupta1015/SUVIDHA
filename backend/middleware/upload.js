import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = './uploads';

// Verify local uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types (exact match — no regex partial match)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitize original name: keep only alphanumeric and hyphens
    const safeName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 60); // cap length
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

// Strict file filter — validate both MIME type AND extension
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk  = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    return cb(null, true);
  }
  cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Allowed formats: JPEG, PNG, PDF only.'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB hard limit
    files: 1                     // only one file per request
  }
});

// Multer error handler middleware — call after upload route to catch size/type errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size allowed is 5 MB.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'File upload error.' });
  }
  next(err);
};

export default upload;

