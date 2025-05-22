import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly cacheVersion: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.cacheVersion = this.configService.get('CACHE_VERSION');
  }

  private generateKey(key: string): string {
    return `${this.cacheVersion}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(this.generateKey(key));
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return undefined;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(this.generateKey(key), value, ttl);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(this.generateKey(key));
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      console.error('Cache reset error:', error);
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
      const keys = await this.cacheManager.store.keys(pattern);
      await Promise.all(keys.map(key => this.del(key)));
    } catch (error) {
      console.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
    }
  }
} 