import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheConfigService } from './cache-config.service';
import { Course } from '../courses/entities/course.entity';
import { Module } from '../modules/entities/module.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { UserEnrollment } from '../enrollments/entities/user-enrollment.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private readonly cacheEnabled: boolean;
  private isConnected = false;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly cacheConfig: CacheConfigService
  ) {
    this.cacheEnabled = this.configService.get('CACHE_ENABLED') === 'true';
    this.logger.log(`Cache is ${this.cacheEnabled ? 'enabled' : 'disabled'}`);
    this.logger.log(`Redis configuration: host=${this.configService.get('REDIS_HOST')}, port=${this.configService.get('REDIS_PORT')}`);
  }

  async onModuleInit() {
    if (this.cacheEnabled) {
      await this.testRedisConnection();
    }
  }

  private async testRedisConnection() {
    try {
      const testKey = 'test:connection';
      await this.cacheManager.set(testKey, 'connected', 10);
      const value = await this.cacheManager.get(testKey);
      
      if (value === 'connected') {
        this.isConnected = true;
        this.logger.log('Redis connection test: SUCCESS');
        
        // Log store details
        const store = (this.cacheManager as any).store;
        this.logger.log(`Cache store type: ${store?.constructor?.name || 'unknown'}`);
        this.logger.log(`Cache store methods: ${Object.keys(store || {}).join(', ')}`);
      } else {
        this.logger.error('Redis connection test: FAILED - Value mismatch');
      }
    } catch (error) {
      this.logger.error('Redis connection test failed:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.cacheEnabled || !this.isConnected) {
      this.logger.debug(`Cache is ${!this.cacheEnabled ? 'disabled' : 'not connected'}, skipping get for key ${key}`);
      return null;
    }

    try {
      this.logger.debug(`Attempting to get cache for key ${key}`);
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT for key ${key}`);
        return value;
      } else {
        this.logger.debug(`Cache MISS for key ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}: ${error.message}`, error.stack);
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    if (!this.cacheEnabled || !this.isConnected) {
      this.logger.debug(`Cache is ${!this.cacheEnabled ? 'disabled' : 'not connected'}, skipping set for key ${key}`);
      return;
    }

    try {
      this.logger.debug(`Attempting to set cache for key ${key} with TTL ${ttl}s`);
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      this.logger.debug(`Successfully set cache for key ${key}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}: ${error.message}`, error.stack);
      this.isConnected = false;
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

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
    if (!this.cacheEnabled) {
      return;
    }

    try {
      this.logger.debug(`Deleting cache by pattern ${pattern}`);
      // Get all keys from the cache store
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
    if (!this.cacheEnabled) {
      return;
    }

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

  // Course-specific cache methods
  async getCourse(courseId: string, tenantId: string, organisationId: string): Promise<Course | null> {
    if (!this.cacheEnabled) {
      return null;
    }
    return this.get<Course>(this.cacheConfig.getCourseKey(courseId, tenantId, organisationId));
  }

  async setCourse(course: Course): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.set(
      this.cacheConfig.getCourseKey(course.courseId, course.tenantId, course.organisationId),
      course,
      this.cacheConfig.COURSE_TTL
    );
  }

  async invalidateCourse(courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    // Invalidate course-specific caches
    await Promise.all([
      this.del(this.cacheConfig.getCourseKey(courseId, tenantId, organisationId)),
      this.del(this.cacheConfig.getCourseHierarchyKey(courseId, tenantId, organisationId)),
      this.delByPattern(this.cacheConfig.getCourseModulesPattern(courseId, tenantId, organisationId)),
      this.delByPattern(this.cacheConfig.getCourseSearchKey(tenantId, organisationId)),
    ]);

    // Invalidate related module caches
    await this.invalidateCourseModules(courseId, tenantId, organisationId);

    // Invalidate related lesson caches
    await this.invalidateCourseLessons(courseId, tenantId, organisationId);

    // Invalidate related enrollment caches
    await this.invalidateCourseEnrollments(courseId, tenantId, organisationId);
  }

  async invalidateCourseModules(courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.delByPattern(this.cacheConfig.getCourseModulesPattern(courseId, tenantId, organisationId));
  }

  async invalidateCourseLessons(courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.delByPattern(`${this.cacheConfig.LESSON_PREFIX}course:${courseId}:${tenantId}:${organisationId}:*`);
  }

  async invalidateCourseEnrollments(courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.delByPattern(`${this.cacheConfig.ENROLLMENT_PREFIX}*:${courseId}:${tenantId}:${organisationId}:*`);
  }

  // Module-specific cache methods
  async getModule(moduleId: string, tenantId: string, organisationId: string): Promise<Module | null> {
    if (!this.cacheEnabled) {
      return null;
    }
    return this.get<Module>(this.cacheConfig.getModuleKey(moduleId, tenantId, organisationId));
  }

  async setModule(module: Module): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.set(
      this.cacheConfig.getModuleKey(module.moduleId, module.tenantId, module.organisationId),
      module,
      this.cacheConfig.MODULE_TTL
    );
  }

  async invalidateModule(moduleId: string, courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    // Invalidate module-specific caches
    await Promise.all([
      this.del(this.cacheConfig.getModuleKey(moduleId, tenantId, organisationId)),
      this.del(this.cacheConfig.getModuleHierarchyKey(moduleId, tenantId, organisationId)),
      this.delByPattern(this.cacheConfig.getModuleLessonsPattern(moduleId, tenantId, organisationId)),
    ]);

    // Invalidate parent course caches
    await this.invalidateCourse(courseId, tenantId, organisationId);
  }

  // Lesson-specific cache methods
  async getLesson(lessonId: string, tenantId: string, organisationId: string): Promise<Lesson | null> {
    if (!this.cacheEnabled) {
      return null;
    }
    return this.get<Lesson>(this.cacheConfig.getLessonKey(lessonId, tenantId, organisationId));
  }

  async setLesson(lesson: Lesson): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.set(
      this.cacheConfig.getLessonKey(lesson.lessonId, lesson.tenantId, lesson.organisationId),
      lesson,
      this.cacheConfig.LESSON_TTL
    );
  }

  async invalidateLesson(lessonId: string, moduleId: string, courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    // Invalidate lesson-specific caches
    await Promise.all([
      this.del(this.cacheConfig.getLessonKey(lessonId, tenantId, organisationId)),
      this.invalidateCourse(courseId, tenantId, organisationId),
      this.invalidateModule(moduleId, courseId, tenantId, organisationId),
    ]);
  }

  // Enrollment-specific cache methods
  async getEnrollment(userId: string, courseId: string, tenantId: string, organisationId: string): Promise<UserEnrollment | null> {
    if (!this.cacheEnabled) {
      return null;
    }
    return this.get<UserEnrollment>(
      this.cacheConfig.getEnrollmentKey(userId, courseId, tenantId, organisationId)
    );
  }

  async setEnrollment(enrollment: UserEnrollment): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await this.set(
      this.cacheConfig.getEnrollmentKey(enrollment.userId, enrollment.courseId, enrollment.tenantId, enrollment.organisationId),
      enrollment,
      this.cacheConfig.ENROLLMENT_TTL
    );
  }

  async invalidateEnrollment(userId: string, courseId: string, tenantId: string, organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    // Invalidate enrollment-specific caches
    await Promise.all([
      this.del(this.cacheConfig.getEnrollmentKey(userId, courseId, tenantId, organisationId)),
      this.delByPattern(this.cacheConfig.getEnrollmentPattern(tenantId, organisationId)),
    ]);
  }

  // Tenant and Organization specific cache invalidation
  async invalidateTenantCache(tenantId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await Promise.all([
      this.delByPattern(`${this.cacheConfig.COURSE_PREFIX}*:${tenantId}:*`),
      this.delByPattern(`${this.cacheConfig.MODULE_PREFIX}*:${tenantId}:*`),
      this.delByPattern(`${this.cacheConfig.LESSON_PREFIX}*:${tenantId}:*`),
      this.delByPattern(`${this.cacheConfig.ENROLLMENT_PREFIX}*:${tenantId}:*`),
    ]);
  }

  async invalidateOrganizationCache(organisationId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }
    await Promise.all([
      this.delByPattern(`${this.cacheConfig.COURSE_PREFIX}*:*:${organisationId}:*`),
      this.delByPattern(`${this.cacheConfig.MODULE_PREFIX}*:*:${organisationId}:*`),
      this.delByPattern(`${this.cacheConfig.LESSON_PREFIX}*:*:${organisationId}:*`),
      this.delByPattern(`${this.cacheConfig.ENROLLMENT_PREFIX}*:*:${organisationId}:*`),
    ]);
  }
} 