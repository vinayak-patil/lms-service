import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import cacheConfig from '../config/cache.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(cacheConfig),
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('cache.ttl.default') * 1000, // Convert to milliseconds
        max: configService.get('cache.store.max'),
        store: configService.get('cache.store.type'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {} 