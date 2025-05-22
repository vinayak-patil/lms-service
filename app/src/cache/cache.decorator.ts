import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';
export const CACHE_INVALIDATE = 'cache_invalidate';

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);
export const CacheInvalidate = (pattern: string) => SetMetadata(CACHE_INVALIDATE, pattern);

export const CacheCourse = () => CacheKey('course');
export const CacheUser = () => CacheKey('user');
export const CacheSearch = () => CacheKey('search'); 