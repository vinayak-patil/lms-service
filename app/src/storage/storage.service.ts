import { Injectable } from '@nestjs/common';
import { IStorageService, PresignedUrlResponse } from './interfaces/storage.interface';
import { S3StorageService } from './providers/s3-storage.service';
import { TenantOrg } from '../common/decorators/tenant-org.decorator';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class StorageService implements IStorageService {
  private storageDriver: IStorageService;

  constructor(private configService: ConfigurationService) {
    this.storageDriver = this.createStorageDriver();
  }

  private createStorageDriver(tenantId?: string): IStorageService {
    const driver = this.configService.getValue('cloud_storage_provider', 'aws');
    switch (driver) {
      case 'aws':
        return new S3StorageService(this.configService);
      // Add other storage providers here
      default:
        throw new Error(`Unsupported storage driver: ${driver}`);
    }
  }

  getPresignedUrl(
    type: string,
    mimeType: string,
    fileName?: string,
    tenantId?: string,
  ): Promise<PresignedUrlResponse> {
    // Recreate storage driver with tenant context
    this.storageDriver = this.createStorageDriver(tenantId);
    return this.storageDriver.getPresignedUrl(type, mimeType, fileName);
  }
} 