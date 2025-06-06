import { Injectable } from '@nestjs/common';
import { StorageService, StorageType } from '../interfaces/storage.interface';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileValidationConfig } from '../../config/file.validation.config';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    const config = this.configService.get<FileValidationConfig>('fileValidation')!;
    const s3Config = config.storage.options;
    
    if (!s3Config.bucket || !s3Config.region || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
      throw new Error('S3 configuration is missing required fields');
    }

    this.bucket = s3Config.bucket;
    this.region = s3Config.region;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
  }

  private buildS3Key(metadata: {
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
    type: 'course' | 'module' | 'lesson' | 'media';
  }, fileName: string): string {
    const parts: string[] = ['lms'];

    if (metadata.courseId) {
      parts.push(metadata.courseId);
    }

    if (metadata.moduleId) {
      parts.push(metadata.moduleId);
    }

    if (metadata.lessonId) {
      parts.push(metadata.lessonId);
    }

    if (metadata.type === 'media') {
      parts.push('media');
    }

    parts.push(fileName);
    return parts.join('/');
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
    const s3Key = this.buildS3Key(metadata, file.originalname);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
    );

    return s3Key;
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      })
    );
  }

  getFileUrl(filePath: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
  }

  getProvider(): StorageType {
    return 's3';
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test the S3 connection by attempting to list objects
      await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: 'test-connection',
        })
      );
      return true;
    } catch (error) {
      // If the error is not "NoSuchKey", the configuration is valid
      return error.name === 'NoSuchKey';
    }
  }

  getPublicUrl(filePath: string): string {
    return this.getFileUrl(filePath);
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });

    return getS3SignedUrl(this.s3Client, command, { expiresIn });
  }
} 