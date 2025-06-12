import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { FileUploadService } from '../services/file-upload.service';
/**
 * Helper functions for file uploads
 */

/**
 * Generate a unique filename for uploaded files
 * @param req Request object
 * @param file File object
 * @param callback Callback function
 */
export const generateUniqueFilename = (req, file, callback) => {
  const fileExtName = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtName}`;
  callback(null, fileName);
};


/**
 * Get the relative path for an uploaded file
 * @param entityType The type of entity (course, module, lesson)
 * @param filename The name of the uploaded file
 * @returns The relative path to the uploaded file
 */
export const getUploadPath = (entityType: string, filename: string, fileUploadService: FileUploadService): string => {
  return fileUploadService.getUploadPath(entityType, filename);
};