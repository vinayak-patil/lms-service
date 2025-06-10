import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { createStorageConfig, createValidationConfig, ValidationConfig, StorageConfig } from '../../configuration/validation.config';
import { FileValidationError } from '../../common/utils/storage.util';
import { IStorageService, PresignedUrlResponse } from '../interfaces/storage.interface';
import { ConfigurationService } from '../../configuration/configuration.service';
import { RESPONSE_MESSAGES } from '../../common/constants/response-messages.constant';

@Injectable()
export class S3StorageService implements IStorageService {
  private s3Client: S3Client;
  private bucket: string;
  private validationConfig: ValidationConfig;
  private storageConfig: StorageConfig;

  constructor(
    private configService: ConfigurationService
  ) {
    this.storageConfig = createStorageConfig(this.configService);
    const { region, accessKeyId, secretAccessKey, container } = this.storageConfig;
    this.validationConfig = createValidationConfig(this.configService);

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(RESPONSE_MESSAGES.ERROR.MISSING_AWS_CONFIG);
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
      throw new Error(RESPONSE_MESSAGES.ERROR.MISSING_S3_BUCKET);
    }
  }

  // Commented out the old implementation
  
  async getPresignedUrl(
    type: string,
    mimeType: string,
    fileName?: string,
  ): Promise<PresignedUrlResponse> {
    try {
      // Validate file type
      const config = this.validationConfig[type];
      if (!config) {
        throw new FileValidationError(`${RESPONSE_MESSAGES.ERROR.INVALID_UPLOAD_TYPE}: ${type}`);
      }

      if (!config.allowedMimeTypes.includes(mimeType)) {
        throw new FileValidationError(
          `${RESPONSE_MESSAGES.ERROR.INVALID_FILE_TYPE}: ${config.allowedMimeTypes.join(', ')}`,
        );
      }
      // Generate unique file key with UUID
      const fileExt = mimeType.split('/')[1];
      const uniqueFileName = fileName ? `${fileName}-${uuidv4()}` : `${Date.now()}-${uuidv4()}`;
      const key = `${config.path.replace(/^\//, '')}${uniqueFileName}.${fileExt}`;

      // Generate Presigned POST Policy url - Used for uploading files to S3 using a form
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

      // Generate signed url - Directly uploads an object to S3 using AWS credentials
      // const command = new PutObjectCommand({
      //   Bucket: this.bucket,
      //   Key: key,
      //   ContentType: mimeType,
      // });

      // const url = await getSignedUrl(this.s3Client, command, {
      //   expiresIn: this.storageConfig.expiresIn,
      // });

      return {
        url,
        key,
        fields,
        expiresIn: this.storageConfig.expiresIn,
      };
    } catch (error) {
      console.error('Presigned URL Error:', error);
      throw error;
    }
  }

} 