import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
@Global()
@Module({
  imports: [    
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('CACHE_DEFAULT_TTL') * 1000, // Convert to milliseconds
        max: parseInt(configService.get('CACHE_MAX_ITEMS') || '1000', 10), // Ensure it's a number
        store: configService.get('CACHE_STORE_TYPE'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {} 