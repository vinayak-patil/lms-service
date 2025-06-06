import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService, StorageType } from '../interfaces/storage.interface';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import { FileValidationConfig } from '../../config/file.validation.config';
import { FileValidationService } from './file-validation.service';

@Injectable()
export class UploadService implements OnModuleInit {
  private storageService: StorageService;

  constructor(
    private configService: ConfigService,
    private localStorageService: LocalStorageService,
    private s3StorageService: S3StorageService,
    private fileValidationService: FileValidationService,
  ) {}

  async onModuleInit() {
    const config = this.configService.get<FileValidationConfig>('fileValidation')!;
    this.storageService = this.getStorageService(config.storage.type);
  }

  private getStorageService(type: StorageType): StorageService {
    switch (type) {
      case 's3':
        return this.s3StorageService;
      case 'local':
        return this.localStorageService;
      // Future storage providers will be added here
      // case 'azure':
      //   return this.azureStorageService;
      // case 'gcp':
      //   return this.gcpStorageService;
      default:
        return this.localStorageService;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    metadata: {
      courseId?: string;
      moduleId?: string;
      lessonId?: string;
      type: 'course' | 'module' | 'lesson' | 'media';
    }
  ): Promise<string> {
    // Validate file before upload
    await this.fileValidationService.validateFile(file, metadata.type);

    const filePath = await this.storageService.uploadFile(file, metadata);
    return this.storageService.getFileUrl(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.storageService.deleteFile(filePath);
  }

  getFileUrl(filePath: string): string {
    return this.storageService.getFileUrl(filePath);
  }

  async getSignedUrl(filePath: string, expiresIn?: number): Promise<string> {
    return this.storageService.getSignedUrl(filePath, expiresIn);
  }
} 