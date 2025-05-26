import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly cacheVersion: string;
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.cacheVersion = this.configService.get<string>('CACHE_VERSION') || 'v1';
  }

  private generateKey(key: string): string {
    return `${this.cacheVersion}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(this.generateKey(key));
      return value || null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(this.generateKey(key), value, ttl);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(this.generateKey(key));
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.del(this.cacheVersion + ':*');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  generatePaginationKey(baseKey: string, page: number, limit: number): string {
    return `${baseKey}:page:${page}:limit:${limit}`;
  }

  generateUserKey(baseKey: string, userId: string): string {
    return `${baseKey}:user:${userId}`;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redisClient = (this.cacheManager as any).store.getClient();
      if (redisClient && typeof redisClient.keys === 'function') {
        const keys = await redisClient.keys(this.generateKey(pattern) + '*');
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (error) {
      this.logger.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
    }
  }
} 