export type StorageType = 'local' | 's3' | 'azure' | 'gcp';

export interface StorageConfig {
  type: StorageType;
  options: {
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    connectionString?: string;
    container?: string;
    projectId?: string;
    credentials?: Record<string, any>;
    [key: string]: any; // Allow for provider-specific options
  };
}

export interface StorageService {
  uploadFile(
    file: Express.Multer.File,
    metadata: {
      courseId?: string;
      moduleId?: string;
      lessonId?: string;
      type: 'course' | 'module' | 'lesson' | 'media';
    }
  ): Promise<string>;
  
  deleteFile(filePath: string): Promise<void>;
  
  getFileUrl(filePath: string): string;

  // New methods for better extensibility
  getProvider(): StorageType;
  
  validateConfig(): Promise<boolean>;
  
  getPublicUrl(filePath: string): string;
  
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
} 