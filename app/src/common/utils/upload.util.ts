import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { validationConfig } from '../../config/file-validation.config';
import * as sharp from 'sharp';
import * as fs from 'fs';

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
 * Filter to allow only image files based on validation config
 * @param req Request object
 * @param file File object 
 * @param callback Callback function
 * @param moduleType The type of module (course, module, lesson)
 */
export const imageFileFilter = async (req, file, callback, moduleType: string, fileType: string) => {
  const config = validationConfig[moduleType];
  
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    return callback(new Error(`Only ${config.allowedMimeTypes.join(', ')} files are allowed!`), false);
  }
  
  if (file.size > config.maxSizeInBytes) {
    return callback(new Error(`File size must not exceed ${config.maxSizeInBytes / (1024 * 1024)}MB`), false);
  }

  if (config.validateDimensions && fileType === 'image') {
    try {
      // Get image metadata to check dimensions
      const metadata = await sharp(file.buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return callback(new Error('Could not determine image dimensions'), false);
      }

      const { width, height } = metadata;

      // Check minimum dimensions
      if (width < config.minWidth || height < config.minHeight) {
        return callback(
          new Error(`Image width and height must be at least ${config.minWidth}px and ${config.minHeight}px`),
          false
        );
      }

      // Check maximum dimensions
      if (width > config.maxWidth || height > config.maxHeight) {
        return callback(
          new Error(`Image width and height must not exceed ${config.maxWidth}px and ${config.maxHeight}px`),
          false
        );
      }

      callback(null, true);
    } catch (error) {
      callback(new Error('Failed to validate image dimensions'), false);
    }
  } else {
    callback(null, true);
  }
};

/**
 * Create storage configuration for different entity types
 * @param entityType The type of entity (course, module, lesson)
 * @param fileType The type of file (image, document)
 * @returns Multer storage configuration
 */
export const createStorage = (
  entityType: string,
  fileType: string
) => {
  const config = validationConfig[entityType];
  
  // Ensure upload directory exists
  const uploadDir = path.resolve(process.cwd(), config.path.replace(/^\//, ''));
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: (req, file, callback) => {
        callback(null, uploadDir);
      },
      filename: (req, file, callback) => {
        const fileExtName = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtName}`;
        callback(null, fileName);
      },
    }),
    fileFilter: (req, file, callback) => imageFileFilter(req, file, callback, entityType, fileType),
  };
};

/**
 * Get the relative path for an uploaded file
 * @param entityType The type of entity (course, module, lesson)
 * @param filename The name of the uploaded file
 * @returns The relative path to the uploaded file
 */
export const getUploadPath = (entityType: string, filename: string): string => {
  const config = validationConfig[entityType];
  return path.join(config.path, filename).replace(/\\/g, '/');
};