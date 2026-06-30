import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Allowed MIME types (exact match — no regex partial match)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// Primary Storage: Cloudinary
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource_type based on mime
    let folder = 'suvidha/images';
    let resource_type = 'image';
    if (file.mimetype === 'application/pdf') {
      folder = 'suvidha/documents';
      resource_type = 'raw'; // PDF requires raw in Cloudinary
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);

    return {
      folder,
      resource_type,
      public_id: `${safeName}-${uniqueSuffix}`,
    };
  },
});

// Enforce Enterprise Cloud Storage (Phase 3 Upgrade)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  WARNING: Cloudinary credentials missing in .env. Uploads will fail.");
}

const storage = cloudStorage;

// T5: MIME-to-extension cross-validation table — prevents spoofed extensions
// e.g. a JPEG renamed as .pdf would have mimetype=image/jpeg but ext=.pdf → REJECTED
const MIME_EXT_MATRIX = {
  'image/jpeg':      ['.jpg', '.jpeg'],
  'image/jpg':       ['.jpg', '.jpeg'],
  'image/png':       ['.png'],
  'application/pdf': ['.pdf']
};

// Strict file filter — validate MIME type, extension, AND their cross-match
const fileFilter = (req, file, cb) => {
  const ext     = path.extname(file.originalname).toLowerCase();
  const mime    = file.mimetype;
  const allowed = MIME_EXT_MATRIX[mime];

  // Step 1: MIME type must be in allowed list
  if (!allowed) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Allowed formats: JPEG, PNG, PDF only.'));
  }

  // Step 2: Extension must be in allowed list
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'File extension not allowed. Use .jpg, .jpeg, .png, or .pdf'));
  }

  // Step 3: Extension must match the declared MIME type (prevents spoofing)
  if (!allowed.includes(ext)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `File extension "${ext}" does not match file type. Possible spoofed file detected.`));
  }

  cb(null, true);
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

