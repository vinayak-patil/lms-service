import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import { FileUploadService, UploadConfig } from '../services/file-upload.service';

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
  fileUploadService: FileUploadService,
): UploadConfig => {
  return fileUploadService.getUploadConfig(entityType as any);
};