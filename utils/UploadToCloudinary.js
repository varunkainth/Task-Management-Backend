import cloudinary from "../config/Cloudinary.js";

/**
 * Uploads an image to Cloudinary with a dynamic folder structure.
 * @param {string} filePath - The local file path of the image to upload.
 * @param {string} [taskId] - The ID of the task (optional).
 * @param {string} [subTaskId] - The ID of the sub-task (optional).
 * @param {string} [userName] - The username for user profile pictures (optional).
 * @returns {Promise<object>} The result of the upload operation.
 * @throws {Error} If the upload operation fails.
 */
export const uploadImage = async (filePath, taskId, subTaskId, userName) => {
  try {
    let folderPath = 'Task Management';

    if (userName) {
      // Folder path for user profile pictures
      folderPath += `/user/${userName}/profile`;
    } else if (taskId) {
      // Folder path for tasks and sub-tasks
      folderPath += `/tasks/${taskId}`;
      if (subTaskId) {
        folderPath += `/subtasks/${subTaskId}`;
      }
    } else {
      // Default folder path
      folderPath += '/general';
    }

    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: folderPath,
      use_filename: true,
      unique_filename: false
    });

    return result; 
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
