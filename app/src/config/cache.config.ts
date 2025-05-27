import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  // Cache TTLs in seconds
  ttl: {
    default: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10), // 1 hour
    user: parseInt(process.env.CACHE_USER_TTL || '600', 10), // 10 minutes    
  },
  // Cache store configuration
  store: {
    type: process.env.CACHE_STORE_TYPE || 'memory',
    max: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  },
  // Cache key prefixes
  prefix: {
    course: process.env.CACHE_COURSE_PREFIX || 'courses',
    module: process.env.CACHE_MODULE_PREFIX || 'modules',
    lesson: process.env.CACHE_LESSON_PREFIX || 'lessons',
    media: process.env.CACHE_MEDIA_PREFIX || 'media',
    user: process.env.CACHE_USER_PREFIX || 'user',
  },
  enabled: process.env.CACHE_ENABLED || 'false',
})); 