import cloudinary from "../config/Cloudinary.js";

export const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: 'Task Management',
      use_filename: true, 
      unique_filename: false 
    });
    return result; 
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

