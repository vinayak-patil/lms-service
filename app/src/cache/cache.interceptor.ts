import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_KEY, CACHE_TTL, CACHE_INVALIDATE } from './cache.decorator';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (!this.configService.get('CACHE_ENABLED')) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Handle cache invalidation
    const invalidatePattern = Reflect.getMetadata(CACHE_INVALIDATE, handler);
    if (invalidatePattern) {
      await this.cacheService.invalidatePattern(invalidatePattern);
      return next.handle();
    }

    // Handle cache retrieval
    const cacheKey = Reflect.getMetadata(CACHE_KEY, handler);
    if (!cacheKey) {
      return next.handle();
    }

    const key = this.generateCacheKey(cacheKey, request);
    const cachedData = await this.cacheService.get(key);

    if (cachedData) {
      return of(cachedData);
    }

    const ttl = Reflect.getMetadata(CACHE_TTL, handler) || this.configService.get('CACHE_TTL');

    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheService.set(key, data, ttl);
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const { query, params, user } = request;
    let key = baseKey;

    if (query.page && query.limit) {
      key = this.cacheService.generatePaginationKey(key, query.page, query.limit);
    }

    if (params.id) {
      key = `${key}:${params.id}`;
    }

    if (user?.id) {
      key = this.cacheService.generateUserKey(key, user.id);
    }

    return key;
  }
} 