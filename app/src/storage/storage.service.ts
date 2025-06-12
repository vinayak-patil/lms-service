import { Injectable } from '@nestjs/common';
import { IStorageService, PresignedUrlResponse, FileUploadResponse } from './interfaces/storage.interface';
import { S3StorageService } from './providers/s3-storage.service';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { StorageHelper } from './helpers/storage.helper';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class StorageService implements IStorageService {
  private storageDriver: IStorageService;
  private storageHelper: StorageHelper;

  constructor(
    private readonly configurationService: ConfigurationService
  ) {
    this.storageHelper = new StorageHelper(this.configurationService);
    this.storageDriver = this.createStorageDriver();
  }

  private createStorageDriver(): IStorageService {
    const storageProvider = this.storageHelper.getStorageProvider();
    switch (storageProvider.toLowerCase()) {
      case 'aws':
        return new S3StorageService(this.storageHelper);      
      default:
        throw new Error(`${RESPONSE_MESSAGES.ERROR.UNSUPPORTED_STORAGE_PROVIDER}: ${storageProvider}`);
    }
  }

  async getPresignedUrl(
    type: string,
    mimeType: string,
    fileName?: string,
  ): Promise<PresignedUrlResponse> {
    return this.storageDriver.getPresignedUrl(type, mimeType, fileName);
  }

  async verifyCredentials(): Promise<boolean> {
    return this.storageDriver.verifyCredentials();
  }
} 