import { Module, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheConfigService } from './cache-config.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        
        try {
          const store = redisStore.create({
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD', ''),
            db: configService.get('REDIS_DB', 0),
            retry_strategy: (options) => {
              logger.error(`Redis connection error: ${options.error?.message}`);
              if (options.attempt > 3) {
                logger.error('Redis connection failed after 3 attempts');
                return new Error('Redis connection failed');
              }
              return Math.min(options.attempt * 100, 3000);
            }
          });

          logger.log('Redis store initialized successfully');
          
          return {
            store,
            ttl: configService.get('CACHE_DEFAULT_TTL', 3600) * 1000,
            max: configService.get('CACHE_MAX_ITEMS', 1000),
          };
        } catch (error) {
          logger.error('Failed to initialize Redis store:', error);
          throw error;
        }
      },
    }),
  ],
  providers: [CacheService, CacheConfigService],
  exports: [CacheService, CacheConfigService],
})
export class CacheModule {} 