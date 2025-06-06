import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidationConfig } from '../../config/file.validation.config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private configService: ConfigService) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const config = this.configService.get<FileValidationConfig>('fileValidation')!;

    // Check file type
    if (!config.allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${config.allowedFileTypes.join(', ')}`
      );
    }

    // Check file size
    if (file.size > config.maxFileSize) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${config.maxFileSize} bytes`
      );
    }

    return file;
  }
} 