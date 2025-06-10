import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigDto } from './dto/configuration.dto';
import { HttpService } from '@nestjs/axios';
import { empty, firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '../common/tenant.context';
import { RESPONSE_MESSAGES } from '../common/constants/response-messages.constant';

@Injectable()
export class ConfigurationService {
  private readonly configDir: string;
  private configFile: string;
  private configsJson: any;
  private lmsConfigJson: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly tenantContext: TenantContext,
  ) {
    // Get config directory from environment or use default
    const configDirPath = this.configService.get('CONFIG_DIR');
    this.configDir = configDirPath || path.join(process.cwd(), 'src');
    this.configFile = this.configService.get("CONFIG_FILE") || 'configs.json';
    
    this.loadConfigFiles();

    // Ensure configs directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    // Initialize config file if it doesn't exist
    this.initializeConfigFile();
  }

  async updateConfig(
    configData: ConfigDto,
    tenantId: string,
  ): Promise<any> {
    try {
      // Read the entire config file
      const allConfigs = await this.readConfigFile();
      
      // Create or update tenant configuration
      const tenantConfig = {
        tenantId: tenantId,
        config: configData.config
      };

      // If tenant exists, merge the configs
      if (allConfigs.tenants[tenantId]) {
        allConfigs.tenants[tenantId] = {
          ...allConfigs.tenants[tenantId],
          config: this.deepMerge(
            allConfigs.tenants[tenantId].config || {},
            tenantConfig.config
          )
        };
      } else {
        // Add new tenant
        allConfigs.tenants[tenantId] = tenantConfig;
      }
      
      // Write back to file
      await this.writeConfigFile(allConfigs);
      
      return {
        success: true,
        message: 'Configuration updated successfully',
        data: allConfigs.tenants[tenantId]
      };
    } catch (error) {
      throw new Error(`${RESPONSE_MESSAGES.ERROR.CONFIG_UPDATE_FAILED}: ${error.message}`);
    }
  }

  async syncExternalConfig(tenantId: string): Promise<any> {
    try {
      // Fetch configuration from external service
      const externalConfig = await this.fetchExternalConfig(tenantId);
      
      if (!externalConfig) {
        // if external config is not found, parse lms-config.json write into configs.json - only clild properties with values
        const lmsConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'app/src/lms-config.json'), 'utf8'));
        const config = {};
        for (const section in lmsConfig.properties) {
          for (const property in lmsConfig.properties[section].properties) {
            if (lmsConfig.properties[section].properties[property].default) {
              config[property] = lmsConfig.properties[section].properties[property].default;
            }
          }
        }
        fs.writeFileSync(path.join(this.configDir, this.configFile), JSON.stringify(config, null, 2));

        return {
          success: true,
          message: RESPONSE_MESSAGES.ERROR.EXTERNAL_CONFIG_NOT_FOUND,
          data: config
        };
      }
      // Read current configuration
      const allConfigs = await this.readConfigFile();
      
      // Create or update tenant configuration with external data
      const tenantConfig = {
        tenantId: tenantId,
        config: externalConfig,
        lastSynced: new Date().toISOString()
      };

      // If tenant exists, merge the configs
      if (allConfigs.tenants[tenantId]) {
        allConfigs.tenants[tenantId] = {
          ...allConfigs.tenants[tenantId],
          config: this.deepMerge(
            allConfigs.tenants[tenantId].config || {},
            tenantConfig.config
          ),
          lastSynced: tenantConfig.lastSynced
        };
      } else {
        // Add new tenant
        allConfigs.tenants[tenantId] = tenantConfig;
      }
      
      // Write back to file
      await this.writeConfigFile(allConfigs);
      
      return {
        success: true,
        message: 'External configuration synced successfully',
        data: allConfigs.tenants[tenantId]
      };
    } catch (error) {
      throw new Error(`${RESPONSE_MESSAGES.ERROR.EXTERNAL_CONFIG_SYNC_FAILED}: ${error.message}`);
    }
  }

  async fetchExternalConfig(tenantId: string): Promise<any> {
    try {
      const externalConfigUrl = this.configService.get('EXTERNAL_CONFIG_URL');
      if (!externalConfigUrl) {
        throw new Error(RESPONSE_MESSAGES.ERROR.EXTERNAL_CONFIG_URL_MISSING);
      }

      const response = await firstValueFrom(
        this.httpService.get(`${externalConfigUrl}/config/${tenantId}`)
      );

      return response.data;
    } catch (error) {
      throw new Error(`${RESPONSE_MESSAGES.ERROR.EXTERNAL_CONFIG_FETCH_FAILED}: ${error.message}`);
    }
  }


  private loadConfigFiles() {
    try {
      const configsPath = path.join(this.configDir, this.configFile);
      const lmsConfigPath = path.join(process.cwd(), 'src/lms-config.json');
      
      this.configsJson = JSON.parse(fs.readFileSync(configsPath, 'utf8'));
      this.lmsConfigJson = JSON.parse(fs.readFileSync(lmsConfigPath, 'utf8'));
    } catch (error) {
      console.error('Error loading configuration files:', error);
    }
  }

  private initializeConfigFile() {
    const configPath = path.join(this.configDir, this.configFile);
    if (!fs.existsSync(configPath)) {
      const initialConfig = {
        tenants: {}
      };
      fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));
    }
  }

  private async writeConfigFile(data: any): Promise<void> {
    const configPath = path.join(this.configDir, this.configFile);
    await fs.promises.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8');
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  async readConfigFile(): Promise<any> {
    try {
      const configPath = path.join(this.configDir, this.configFile);
      const data = await fs.promises.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config file:', error);
      return { tenants: {} };
    }
  }

  // LMS Config Service Methods
  getValue(key: string, defaultValue: any = null): any {
    // First try tenant-specific config if tenantId is provided
    const tenantId = this.tenantContext.getTenantId();
   
    if (tenantId) {
      const tenantConfig = this.configsJson?.tenants?.[tenantId]?.config;
      if (tenantConfig && tenantConfig[key] !== undefined) {
          return tenantConfig[key];
      }
    }

    // Finally try environment variables
    const envValue = this.configService.get(key);
    if (envValue !== undefined) {
      return envValue;
    }
    
    
    // Then try lms-config.json
    if (this.lmsConfigJson) {
      const lmsValue = this.getLmsConfigValue(key);
      if (lmsValue !== undefined) {
        return lmsValue;
      }else{
        return defaultValue;
      }
    }
    return defaultValue;
  }

  private getLmsConfigValue(key: string): any {
    // Helper function to search through lms-config.json structure
    const searchInProperties = (properties: any): any => {
      for (const section in properties) {
        const sectionProps = properties[section].properties;
        if (sectionProps && sectionProps[key]) {
          return sectionProps[key].default;
        }
      }
      return undefined;
    };

    return searchInProperties(this.lmsConfigJson.properties);
  }

  // Helper methods for specific configuration types
  getStorageConfig() {
    return {
      region: this.getValue('storage_region', ''),
      accessKeyId: this.getValue('storage_key', ''),
      secretAccessKey: this.getValue('storage_secret', ''),
      container: this.getValue('storage_container', ''),
      expiresIn: Number(this.getValue('presigned_url_expires_in', 300)), // 300 seconds
    };
  }

  getMediaConfig() {
    return {
      imageMimeTypes: this.getValue('image_mime_type', 'image/jpeg, image/jpg, image/png')
        .split(',')
        .map((type: string) => type.trim()),
      imageMaxSize: Number(this.getValue('image_filesize', 50)) * 1024 * 1024,
      videoMimeTypes: this.getValue('video_mime_type', 'video/mp4, video/webm')
        .split(',')
        .map((type: string) => type.trim()),
      videoMaxSize: Number(this.getValue('video_filesize', 500)) * 1024 * 1024,
    };
  }

  getUploadPaths() {
    return {
      courses: this.getValue('courses_upload_path', '/uploads/courses'),
      modules: this.getValue('module_upload_path', '/uploads/modules'),
      lessons: this.getValue('lessons_upload_path', '/uploads/lessons'),
    };
  }

  // Method to reload configurations
  async reloadConfigs() {
    await this.loadConfigFiles();
  }
} 