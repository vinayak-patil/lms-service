import { createStorage } from "src/common/utils/storage.util";
import { ConfigurationService } from './configuration.service';

export interface FileConfig {
  path: string;
  allowedMimeTypes: string[];
  maxSizeInBytes: number;
}

export interface ValidationConfig {
  course: FileConfig;
  module: FileConfig;
  lesson: FileConfig;
  lessonMedia: FileConfig;
  lessonAssociatedMedia: FileConfig;
}

export interface StorageConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  container: string;
  expiresIn: number;
}

export const createValidationConfig = (configService: ConfigurationService): ValidationConfig => {
    
  const mediaConfig = configService.getMediaConfig();
  const uploadPaths = configService.getUploadPaths();

  return {
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
      path: '/uploads/lessons/media',
      allowedMimeTypes: mediaConfig.videoMimeTypes,
      maxSizeInBytes: mediaConfig.videoMaxSize,
    },
    lessonAssociatedMedia: {
      path: '/uploads/lessons/associated-media',
      allowedMimeTypes: mediaConfig.imageMimeTypes,
      maxSizeInBytes: mediaConfig.imageMaxSize,
    },
  };
};

export const createStorageConfig = (configService: ConfigurationService): StorageConfig => {
  return configService.getStorageConfig();
};
export const uploadConfigs = {
  courses: createStorage('course'),
  modules: createStorage('module'),
  lessons: createStorage('lesson'),
  media: createStorage('lessonMedia'),
  associatedMedia: createStorage('lessonAssociatedMedia'),
}; 