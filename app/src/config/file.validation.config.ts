import { registerAs } from '@nestjs/config';
import { StorageType, StorageConfig } from '../common/interfaces/storage.interface';

export interface FileValidationRule {
  allowedMimeTypes: string[];
  maxSize: number;
  minSize?: number;
  maxFiles?: number;
  allowedExtensions?: string[];
  doValidateDimensions?: boolean;
  validateDimensions?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
}

export interface FileValidationConfig {
  storage: StorageConfig;
  rules: {
    course: FileValidationRule;
    module: FileValidationRule;
    lesson: FileValidationRule;
    media: FileValidationRule;
  };
}

// Course-specific rules
const courseRule: FileValidationRule = {
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  maxSize: 2 * 1024 * 1024, // 2MB
  minSize: 1024, // 1KB
  allowedExtensions: ['.jpg', '.jpeg', '.png'],
  doValidateDimensions: false,
  validateDimensions: {
    minWidth: 800,
    maxWidth: 1920,
    minHeight: 400,
    maxHeight: 1080,
  },
};

// Module-specific rules
const moduleRule: FileValidationRule = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: 2 * 1024 * 1024, // 2MB
  minSize: 1024, // 1KB
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
  doValidateDimensions: true,
  validateDimensions: {
    minWidth: 400,
    maxWidth: 1280,
    minHeight: 300,
    maxHeight: 720,
  },
};

// Lesson-specific rules
const lessonRule: FileValidationRule = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: 2 * 1024 * 1024, // 2MB
  minSize: 1024, // 1KB
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
  doValidateDimensions: false,
  validateDimensions: {
    minWidth: 400,
    maxWidth: 1280,
    minHeight: 300,
    maxHeight: 720,
  },
};

// Media-specific rules with different categories
const mediaRule: FileValidationRule = {
  allowedMimeTypes: [
    // Video formats
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Document formats
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Audio formats
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
  ],
  maxSize: 50 * 1024 * 1024, // 50MB
  minSize: 1024, // 1KB
  allowedExtensions: [
    // Video extensions
    '.mp4',
    '.mov',
    '.avi',
    '.webm',
    // Document extensions
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    // Audio extensions
    '.mp3',
    '.wav',
    '.ogg',
    '.webm',
  ],
};

export default registerAs('fileValidation', (): FileValidationConfig => ({
  storage: {
    type: (process.env.STORAGE_TYPE as StorageType) || 'local',
    options: {
      // AWS S3 specific options
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      
      // Azure Blob Storage specific options
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container: process.env.AZURE_STORAGE_CONTAINER,
      
      // GCP Cloud Storage specific options
      projectId: process.env.GCP_PROJECT_ID,
      credentials: process.env.GCP_CREDENTIALS ? JSON.parse(process.env.GCP_CREDENTIALS) : undefined,
    }
  },
  rules: {
    course: courseRule,
    module: moduleRule,
    lesson: lessonRule,
    media: mediaRule,
  },
})); 