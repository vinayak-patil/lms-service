import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidationConfig, FileValidationRule } from '../../config/file.validation.config';
import * as sharp from 'sharp';

@Injectable()
export class FileValidationService {
  constructor(private configService: ConfigService) {}

  private getValidationRule(type: 'course' | 'module' | 'lesson' | 'media'): FileValidationRule {
    const config = this.configService.get<FileValidationConfig>('fileValidation')!;
    return config.rules[type];
  }

  async validateFile(
    file: Express.Multer.File,
    type: 'course' | 'module' | 'lesson' | 'media'
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const rule = this.getValidationRule(type);

    // Check file size
    if (file.size > rule.maxSize) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${rule.maxSize} bytes`
      );
    }

    if (rule.minSize && file.size < rule.minSize) {
      throw new BadRequestException(
        `File size ${file.size} bytes is below minimum allowed size of ${rule.minSize} bytes`
      );
    }

    // Check MIME type
    if (!rule.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${rule.allowedMimeTypes.join(', ')}`
      );
    }

    // Check file extension
    if (rule.allowedExtensions) {
      const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
      if (!rule.allowedExtensions.includes(extension)) {
        throw new BadRequestException(
          `File extension ${extension} is not allowed. Allowed extensions: ${rule.allowedExtensions.join(', ')}`
        );
      }
    }

    // Validate image dimensions if required
    if (rule.doValidateDimensions && rule.validateDimensions && file.mimetype.startsWith('image/')) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        
        if (rule.validateDimensions.minWidth && metadata.width! < rule.validateDimensions.minWidth) {
          throw new BadRequestException(
            `Image width ${metadata.width}px is below minimum allowed width of ${rule.validateDimensions.minWidth}px`
          );
        }

        if (rule.validateDimensions.maxWidth && metadata.width! > rule.validateDimensions.maxWidth) {
          throw new BadRequestException(
            `Image width ${metadata.width}px exceeds maximum allowed width of ${rule.validateDimensions.maxWidth}px`
          );
        }

        if (rule.validateDimensions.minHeight && metadata.height! < rule.validateDimensions.minHeight) {
          throw new BadRequestException(
            `Image height ${metadata.height}px is below minimum allowed height of ${rule.validateDimensions.minHeight}px`
          );
        }

        if (rule.validateDimensions.maxHeight && metadata.height! > rule.validateDimensions.maxHeight) {
          throw new BadRequestException(
            `Image height ${metadata.height}px exceeds maximum allowed height of ${rule.validateDimensions.maxHeight}px`
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to validate image dimensions');
      }
    }
  }
} 