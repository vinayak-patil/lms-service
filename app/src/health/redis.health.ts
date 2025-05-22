import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthCheckError } from '@nestjs/terminus';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async isHealthy(key: string) {
    try {
      const testKey = 'health-check';
      await this.cacheService.set(testKey, 'ok', 10);
      const result = await this.cacheService.get(testKey);
      await this.cacheService.del(testKey);

      if (result === 'ok') {
        return this.getStatus(key, true);
      }
    } catch (error) {
      throw new HealthCheckError(
        'RedisHealthCheck failed',
        this.getStatus(key, false),
      );
    }
  }
} 