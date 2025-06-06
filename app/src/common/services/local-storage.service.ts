import { Injectable } from '@nestjs/common';
import { StorageService, StorageType } from '../interfaces/storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly baseUploadDir = 'uploads';

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.baseUploadDir);
    } catch {
      await fs.mkdir(this.baseUploadDir, { recursive: true });
    }
  }

  private buildFilePath(metadata: {
    courseId?: string;
    moduleId?: string;
    lessonId?: string;
    type: 'course' | 'module' | 'lesson' | 'media';
  }, fileName: string): string {
    const parts: string[] = [this.baseUploadDir];

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
    return path.join(...parts);
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
    const filePath = this.buildFilePath(metadata, file.originalname);
    const directory = path.dirname(filePath);

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getFileUrl(filePath: string): string {
    return `/${filePath}`;
  }

  getProvider(): StorageType {
    return 'local';
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.ensureUploadDirectoryExists();
      return true;
    } catch (error) {
      return false;
    }
  }

  getPublicUrl(filePath: string): string {
    return this.getFileUrl(filePath);
  }

  async getSignedUrl(filePath: string, expiresIn?: number): Promise<string> {
    // Local storage doesn't support signed URLs, so we return the public URL
    return this.getPublicUrl(filePath);
  }
} 