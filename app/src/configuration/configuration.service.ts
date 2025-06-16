import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '../common/tenant/tenant.context';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';
import { TenantConfigValue } from './interfaces/tenant-config.interface';

export interface config {
  path: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  storageConfig: {
    cloudStorageProvider: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    container: string;
    expiresIn: number;
  };
} 

@Injectable()
export class ConfigurationService {
  private lmsConfigJson: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContext: TenantContext,
  ) {
    // Initialize tenant configs in ConfigService if not exists
    const tenantId = this.tenantContext.getTenantId() || '';
    if (!this.configService.get(tenantId)) {
      this.configService.set(tenantId, { config: {},IsConfigsSync: 0 });
    }
    
    // Load LMS config
    this.loadLmsConfig();
  }

  async getConfig(
    entityType: string,
    tenantId: string,
  ): Promise<Record<string, any>> {
    try {
      // Get current tenant config
      const tenantConfig = this.configService.get<TenantConfigValue>(tenantId) || { config: {},IsConfigsSync: 0 };

      // If config is synced, return entity config directly
      if (tenantConfig.config && tenantConfig.IsConfigsSync == 1) {
        const entityConfig = this.getEntityConfigs(entityType, tenantConfig);
        if (!entityConfig) {
          throw new NotFoundException(RESPONSE_MESSAGES.ERROR.CONFIG_NOT_FOUND);
        }
        return entityConfig;
      }else{
        throw new NotFoundException(RESPONSE_MESSAGES.ERROR.CONFIG_NOT_FOUND);
      }
    } catch (error) {     
      throw new NotFoundException(
        `${RESPONSE_MESSAGES.ERROR.CONFIG_FAILED}: ${error.message}`
      );
    }
  }

  async syncTenantConfig(tenantId: string): Promise<any> {
    try {
      // Fetch configuration from external service
      const externalConfig = await this.fetchExternalConfig(tenantId);

      //if externalConfig is empty
      if (Object.keys(externalConfig).length === 0) {
        return this.loadLocalConfig(tenantId);
      }

      // Get current tenant config
      let tenantConfig = this.configService.get<TenantConfigValue>(tenantId) || { config: {},IsConfigsSync: 0 };
      
      // Create or update tenant configuration with external data
      tenantConfig = {
        config: externalConfig,
        lastSynced: new Date().toISOString(),
        IsConfigsSync: 1
      };
      
      // Update ConfigService
      this.configService.set(tenantId, tenantConfig);
      
      return {
        success: true,
        message: 'External configuration synced successfully',
        data: tenantConfig
      };
    } catch (error) {
      return this.loadLocalConfig(tenantId);
    }
  }

  loadLocalConfig(tenantId: string): any {
    // if external config is not found, parse lms-config.json - only child properties with values
    const config = {};
    for (const section in this.lmsConfigJson.properties) {
      for (const property in this.lmsConfigJson.properties[section].properties) {
        if (this.lmsConfigJson.properties[section].properties[property].default) {
          config[property] = this.lmsConfigJson.properties[section].properties[property].default;
        }
      }
    }
    
    // Get current tenant config
    let tenantConfig = this.configService.get<TenantConfigValue>(tenantId) || { config: {},IsConfigsSync: 0 };
    
           
    // Update tenant config
    tenantConfig = {
      config: config,
      lastSynced: new Date().toISOString(),
      IsConfigsSync: 1
    };

    // Update ConfigService
    this.configService.set(tenantId, tenantConfig);

    return {
      success: true,
      message: RESPONSE_MESSAGES.ERROR.EXTERNAL_CONFIG_NOT_FOUND,
      data: config
    };
  }

  async fetchExternalConfig(tenantId: string): Promise<any> {
    try {
      const externalConfigUrl = this.configService.get('CONFIG_URL');
      if (!externalConfigUrl) {
        throw new InternalServerErrorException(RESPONSE_MESSAGES.ERROR.CONFIG_URL_MISSING);
      }

      const response = await axios.get(`${externalConfigUrl}/${tenantId}?context=lms`);
      return response.data.result;
    } catch (error) {
      throw new InternalServerErrorException(`${error.message}`);
    }
  }

  private loadLmsConfig() {
    try {
      const lmsConfigPath = path.join(process.cwd(), this.configService.get('LMS_CONFIG_PATH') || 'src/lms-config.json');
      this.lmsConfigJson = JSON.parse(fs.readFileSync(lmsConfigPath, 'utf8'));
    } catch (error) {
      console.error('Error loading LMS configuration:', error);
    }
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Helper methods for specific configuration types
  public getStorageConfig(tenantConfig: TenantConfigValue) {
    return {
      cloudStorageProvider: tenantConfig.config['cloud_storage_provider'],
      region: tenantConfig.config['storage_region'],
      accessKeyId: tenantConfig.config['storage_key'],
      secretAccessKey: tenantConfig.config['storage_secret'],
      container: tenantConfig.config['storage_container'],
      expiresIn: Number(tenantConfig.config['presigned_url_expires_in']),
    };
  }

  getEntityConfigs(entityType: string, tenantConfig: TenantConfigValue): config {
    const entityConfigMap = {
      course: {
        path: 'courses_upload_path',
        maxFileSize: 'courses_max_file_size',
        allowedMimeTypes: 'courses_allowed_mime_types'
      },
      module: {
        path: 'modules_upload_path',
        maxFileSize: 'modules_max_file_size',
        allowedMimeTypes: 'modules_allowed_mime_types'
      },
      lesson: {
        path: 'lessons_upload_path',
        maxFileSize: 'lessons_max_file_size',
        allowedMimeTypes: 'lessons_allowed_mime_types'
      },
      lessonMedia: {
        path: 'lessons_media_upload_path',
        maxFileSize: 'lessons_media_max_file_size',
        allowedMimeTypes: 'lessons_media_allowed_mime_types'
      },
      lessonAssociatedMedia: {
        path: 'lessons_associated_media_upload_path',
        maxFileSize: 'lessons_associated_media_max_file_size',
        allowedMimeTypes: 'lessons_associated_media_allowed_mime_types'
      }
    };

    const config = entityConfigMap[entityType];
    if (!config) {
      throw new BadRequestException(`${RESPONSE_MESSAGES.ERROR.INVALID_UPLOAD_TYPE}: ${entityType}`);
    }

    return {
      path: tenantConfig.config[config.path],
      maxFileSize: tenantConfig.config[config.maxFileSize],
      allowedMimeTypes: tenantConfig.config[config.allowedMimeTypes],
      storageConfig: this.getStorageConfig(tenantConfig)
    };
  }

} 