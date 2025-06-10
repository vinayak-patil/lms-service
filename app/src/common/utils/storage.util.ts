import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { createStorageConfig, createValidationConfig, ValidationConfig } from '../../configuration/validation.config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { ConfigurationService } from '../../configuration/configuration.service';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '../middleware/tenant.context';
import { HttpService } from '@nestjs/axios';

/**
 * Custom error class for file validation errors
 */
export class FileValidationError extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Create storage configuration for different entity types
 * @param entityType The type of entity (course, module, lesson)
 * @returns Multer storage configuration
 */
export const createStorage = (
  entityType: string,
) => {
  const configService = new ConfigurationService(new ConfigService(), new HttpService(), new TenantContext());
  const validationConfig = createValidationConfig(configService);
  const config = validationConfig[entityType];
  const uploadDir = path.resolve(process.cwd(), `${config.path.replace(/^\//, '')}`);

  const driver = configService.getValue('cloud_storage_provider');
  if (driver != 'local') {
   return {
    storage: driver,
   }
  }

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
    limits: {
      fileSize: config.maxSizeInBytes,
    },
    fileFilter: async (req, file, callback) => {
      try {
        // Check file type first
        if (!config.allowedMimeTypes.includes(file.mimetype)) {
          throw new FileValidationError(
            `Invalid file type. Allowed types are: ${config.allowedMimeTypes.join(', ')}`
          );
        }

        callback(null, true);
      } catch (error) {
        if (error instanceof FileValidationError) {
          callback(error, false);
        } else {
          callback(
            new FileValidationError(
              'An unexpected error occurred while processing the file',
              HttpStatus.INTERNAL_SERVER_ERROR
            ),
            false
          );
        }
      }
    },
  };
};