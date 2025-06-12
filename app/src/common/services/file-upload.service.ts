import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, StorageEngine } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { HttpStatus } from '@nestjs/common';
import { ConfigurationService } from '../../configuration/configuration.service';

export interface UploadConfig {
  storage: StorageEngine | string;
  limits?: {
    fileSize: number;
  };
  fileFilter?: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
}

export class FileValidationError extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}   

interface UploadMetadata {
  type: 'course' | 'module' | 'lesson' | 'lessonMedia' | 'lessonAssociatedMedia';
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
}

export interface StorageConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  container: string;
  expiresIn: number;
}

@Injectable()
export class FileUploadService {
  private readonly baseUploadDir: string;

  constructor(
    private configService: ConfigService,
    private configurationService: ConfigurationService,
  ) {
    // Set base upload directory relative to the application root
    this.baseUploadDir = path.join(process.cwd(), 'uploads');
    // Ensure base upload directory exists
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  getUploadConfig(entityType: 'course' | 'module' | 'lesson' | 'lessonMedia' | 'lessonAssociatedMedia'): UploadConfig {
    const mediaConfig = this.configurationService.getMediaConfig();
    const uploadPaths = this.configurationService.getUploadPaths();

    const config = {
      course: {
        path: uploadPaths.courses,
        allowedMimeTypes: mediaConfig.imageMimeTypes,
        maxSizeInBytes: mediaConfig.imageMaxSize,
      },
      module: {
        path: uploadPaths.modules,
        allowedMimeTypes: mediaConfig.imageMimeTypes,
        maxSizeInBytes: mediaConfig.imageMaxSize,
      },
      lesson: {
        path: uploadPaths.lessons,
        allowedMimeTypes: mediaConfig.imageMimeTypes,
        maxSizeInBytes: mediaConfig.imageMaxSize,
      },
      lessonMedia: {
        path: uploadPaths.lessonsMedia,
        allowedMimeTypes: mediaConfig.documentMimeTypes,
        maxSizeInBytes: mediaConfig.documentMaxSize,
      },
      lessonAssociatedMedia: {
        path: uploadPaths.lessonsAssociatedMedia,
        allowedMimeTypes: mediaConfig.imageMimeTypes,
        maxSizeInBytes: mediaConfig.imageMaxSize,
      },
    }[entityType];

    const uploadDir = path.join(this.baseUploadDir, config.path);

    const driver = this.configurationService.getValue('cloud_storage_provider', 'local');
    if (driver !== 'local') {
      return {
        storage: driver,
      };
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = diskStorage({
      destination: (req, file, callback) => {
        callback(null, uploadDir);
      },
      filename: (req, file, callback) => {
        const fileExtName = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtName}`;
        callback(null, fileName);
      },
    });

    return {
      storage,
      limits: {
        fileSize: config.maxSizeInBytes,
      },
      fileFilter: async (req, file, callback) => {
        try {
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
  }

  async validateFile(file: Express.Multer.File, metadata: UploadMetadata): Promise<void> {
    const config = this.getUploadConfig(metadata.type);
    
    // Check file size
    if (file.size > config.limits?.fileSize!) {
      throw new FileValidationError(
        `File size exceeds the maximum allowed size of ${config.limits?.fileSize! / (1024 * 1024)}MB`
      );
    }

    // Check file type
    const allowedMimeTypes = this.getAllowedMimeTypes(metadata.type);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new FileValidationError(
        `Invalid file type. Allowed types are: ${allowedMimeTypes.join(', ')}`
      );
    }
  }

  async uploadFile(file: Express.Multer.File, metadata: UploadMetadata): Promise<string> {
    // Validate file first
    await this.validateFile(file, metadata);

    const uploadpath = this.getUploadPath(metadata.type);
    const uploadDir = path.resolve(process.cwd(), `${uploadpath.replace(/^\//, '')}`);

    console.log(uploadDir);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Return the relative path
    return this.getUploadPath(metadata.type, fileName);
  }

  private getAllowedMimeTypes(entityType: string): string[] {
    const mediaConfig = this.configurationService.getMediaConfig();
    return entityType === 'lessonMedia' ? mediaConfig.videoMimeTypes : mediaConfig.imageMimeTypes;
  }

  getUploadPath(entityType: string, filename?: string): string {
    const uploadPaths = this.configurationService.getUploadPaths();

    const paths = {
      course: uploadPaths.courses,
      module: uploadPaths.modules,
      lesson: uploadPaths.lessons,
      lessonMedia: uploadPaths.lessonsMedia,
      lessonAssociatedMedia: uploadPaths.lessonsAssociatedMedia,
    };

    const basePath = paths[entityType as keyof typeof paths] || 'uploads';
    return filename ? path.join(basePath, filename).replace(/\\/g, '/') : basePath;
  }

  getFileInterceptor(entityType: 'course' | 'module' | 'lesson' | 'lessonMedia' | 'lessonAssociatedMedia') {
    return FileInterceptor('image', this.getUploadConfig(entityType));
  }

  async deleteFile(filePath: string): Promise<void> {
    const driver = this.configurationService.getValue('cloud_storage_provider', 'local');

    if (driver === 'local') {
      const fullPath = path.join(this.baseUploadDir, filePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return;
    }
  }
} 