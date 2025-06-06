import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './services/upload.service';
import { LocalStorageService } from './services/local-storage.service';
import { S3StorageService } from './services/s3-storage.service';
import { FileValidationService } from './services/file-validation.service';
import fileValidationConfig from '../config/file.validation.config';

@Module({
  imports: [
    ConfigModule.forFeature(fileValidationConfig),
  ],
  providers: [
    UploadService,
    LocalStorageService,
    S3StorageService,
    FileValidationService,
  ],
  exports: [UploadService, FileValidationService],
})
export class CommonModule {}
