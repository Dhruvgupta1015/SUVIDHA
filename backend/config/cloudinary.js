import { v2 as cloudinary } from 'cloudinary';

export const initCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('[Storage] Cloudinary connected successfully');
    return true;
  } else {
    console.warn('[Storage] Cloudinary credentials missing. Falling back to Mock Storage mode.');
    return false;
  }
};

export default cloudinary;
