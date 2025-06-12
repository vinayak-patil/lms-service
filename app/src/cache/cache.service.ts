import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      this.logger.debug(`Getting cache for key ${key}`);
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for key ${key}`);
      } else {
        this.logger.debug(`Cache MISS for key ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const cacheTTL = ttl || this.defaultTTL;
      this.logger.debug(`Setting cache for key ${key} with TTL ${cacheTTL}s`);
      await this.cacheManager.set(key, value, cacheTTL * 1000); // Convert to milliseconds
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      this.logger.debug(`Deleting cache for key ${key}`);
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete multiple values from cache using pattern
   * @param pattern Cache key pattern
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      this.logger.debug(`Deleting cache by pattern ${pattern}`);
      const store = (this.cacheManager as any).store;
      if (!store || typeof store.keys !== 'function') {
        this.logger.warn('Cache store does not support pattern deletion');
        return;
      }

      const keys = await store.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      
      if (matchingKeys.length > 0) {
        this.logger.debug(`Found ${matchingKeys.length} keys matching pattern ${pattern}`);
        await Promise.all(matchingKeys.map(key => this.del(key)));
      } else {
        this.logger.debug(`No keys found matching pattern ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache by pattern ${pattern}: ${error.message}`);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      this.logger.debug('Clearing all cache');
      const store = (this.cacheManager as any).store;
      if (!store || typeof store.reset !== 'function') {
        this.logger.warn('Cache store does not support reset');
        return;
      }
      await store.reset();
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }

  /**
   * Get or set cache value with automatic fallback
   * @param key Cache key
   * @param fetchFn Function to fetch data if cache miss
   * @param ttl Time to live in seconds (optional)
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Generate a cache key with prefix
   * @param prefix Key prefix
   * @param parts Key parts to join
   */
  generateKey(prefix: string, ...parts: (string | number | undefined)[]): string {
    return `${prefix}:${parts.map(part => part === undefined ? '' : part).join(':')}`;
  }
} 