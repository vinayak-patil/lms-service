import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';
import { createStorageConfig, createValidationConfig, ValidationConfig } from '../../configuration/validation.config';
import { FileValidationError } from '../../common/utils/storage.util';
import { IStorageService, PresignedUrlResponse } from '../interfaces/storage.interface';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class S3StorageService implements IStorageService {
  private s3Client: S3Client;
  private bucket: string;
  private validationConfig: ValidationConfig;

  private readonly mimeTypeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };

  constructor(
    private configService: ConfigurationService
  ) {
    const storageConfig = createStorageConfig(this.configService);
    const { region, accessKeyId, secretAccessKey, container } = storageConfig;
    this.validationConfig = createValidationConfig(this.configService);

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    const config = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    this.s3Client = new S3Client(config);
    this.bucket = container;
    
    if (!this.bucket) {
      throw new Error('Missing AWS_S3_BUCKET configuration');
    }
  }

  async getPresignedUrl(
    type: string,
    mimeType: string,
    fileName?: string,
  ): Promise<PresignedUrlResponse> {
    try {
      // Validate file type
      const config = this.validationConfig[type];
      if (!config) {
        throw new FileValidationError(`Invalid upload type: ${type}`);
      }

      if (!config.allowedMimeTypes.includes(mimeType)) {
        throw new FileValidationError(
          `Invalid file type. Allowed types are: ${config.allowedMimeTypes.join(', ')}`,
        );
      }

      // Generate unique file key with UUID
      const fileExt = mimeType.split('/')[1];
      const uniqueFileName = fileName ? `${fileName}-${uuidv4()}` : `${Date.now()}-${uuidv4()}`;
      const key = `${config.path.replace(/^\//, '')}/${uniqueFileName}.${fileExt}`;

      const { url, fields } = await createPresignedPost(this.s3Client, {
        Bucket: this.bucket,
        Key: key,
        Conditions: [
          ['content-length-range', 0, config.maxSizeInBytes],
          ['eq', '$Content-Type', mimeType],
          ['eq', '$key', key],
        ],
        Expires: config.expiresIn,
        Fields: {
          'Content-Type': mimeType,
          'ACL': 'public-read',
          'key': key,
        },
      });

      return {
        url,
        key,
        fields,
        expiresIn: config.expiresIn,
      };
    } catch (error) {
      console.error('Presigned URL Error:', error);
      throw error;
    }
  }
} 