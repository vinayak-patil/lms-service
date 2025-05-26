# Caching Implementation

This module provides a robust caching solution for the LMS microservice using in-memory cache.

## Features

- In-memory caching
- Configurable TTL (Time To Live) for cached items
- Cache versioning support
- Automatic cache invalidation on data modifications
- Pagination-aware caching
- User-specific caching
- Health checks for cache functionality

## Configuration

The caching system can be configured through environment variables:

```env
# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000
CACHE_VERSION=v1
```

## Usage

### Basic Caching

To cache a method's result, use the `@CacheKey()` decorator:

```typescript
@CacheKey('my-cache-key')
async getData(): Promise<any> {
  // Your method implementation
}
```

### Cache with TTL

To set a specific TTL for a cached item:

```typescript
@CacheKey('my-cache-key')
@CacheTTL(600) // 10 minutes
async getData(): Promise<any> {
  // Your method implementation
}
```

### Cache Invalidation

To invalidate cache entries matching a pattern:

```typescript
@CacheInvalidate('pattern:*')
async updateData(): Promise<any> {
  // Your method implementation
}
```

### Pagination-Aware Caching

For paginated results, the cache key automatically includes pagination parameters:

```typescript
@CacheKey('courses:list')
async getCourses(page: number, limit: number): Promise<any> {
  // Your method implementation
}
```

### User-Specific Caching

For user-specific data, the cache key automatically includes the user ID:

```typescript
@CacheKey('user:preferences')
async getUserPreferences(): Promise<any> {
  // Your method implementation
}
```

## Health Checks

The cache functionality can be monitored through the health check endpoint:

```bash
GET /health
```

## Best Practices

1. Use appropriate TTL values:
   - Course listings: 1 hour
   - User-specific data: 10 minutes
   - Search results: 1 hour
2. Be mindful of memory usage since this is an in-memory cache
3. Use cache versioning to invalidate all cache entries when needed
4. Use pattern-based invalidation for related data

## Error Handling

The caching system includes built-in error handling:
- Redis connection failures are logged
- Cache operations failures don't break the application
- Fallback to database queries when cache is unavailable

## Monitoring

Monitor the Redis cache through:
- Health check endpoint
- Redis monitoring tools
- Application logs for cache-related errors 