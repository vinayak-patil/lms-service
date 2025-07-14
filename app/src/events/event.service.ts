import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LmsEvent, LmsEventType } from './lms.events';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit a generic LMS event
   */
  emit(event: LmsEvent): void {
    try {
      // Add timestamp if not provided
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      // Emit the generic event
      this.eventEmitter.emit('lms.event', event);

      // Also emit the specific event type
      this.eventEmitter.emit(event.type, event.payload);

      this.logger.debug(`Event emitted: ${event.type}`, {
        payload: event.payload,
        tenantId: event.tenantId,
        organisationId: event.organisationId,
        userId: event.userId,
      });
    } catch (error) {
      this.logger.error(`Failed to emit event ${event.type}: ${error.message}`, error.stack);
    }
  }

  /**
   * Emit course events
   */
  emitCourseCreated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.COURSE_CREATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitCourseUpdated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.COURSE_UPDATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitCourseDeleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.COURSE_DELETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitCourseCompleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.COURSE_COMPLETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitCourseEnrolled(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.COURSE_ENROLLED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  /**
   * Emit module events
   */
  emitModuleCreated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.MODULE_CREATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitModuleUpdated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.MODULE_UPDATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitModuleDeleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.MODULE_DELETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitModuleCompleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.MODULE_COMPLETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  /**
   * Emit lesson events
   */
  emitLessonCreated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.LESSON_CREATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitLessonUpdated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.LESSON_UPDATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitLessonDeleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.LESSON_DELETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitLessonAttempted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.LESSON_ATTEMPTED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitLessonCompleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.LESSON_COMPLETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitLessonProgressUpdated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.LESSON_PROGRESS_UPDATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  /**
   * Emit enrollment events
   */
  emitEnrollmentCreated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.ENROLLMENT_CREATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitEnrollmentUpdated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.ENROLLMENT_UPDATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitEnrollmentDeleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.ENROLLMENT_DELETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  /**
   * Emit media events
   */
  emitMediaUploaded(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.MEDIA_UPLOADED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitMediaDeleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.MEDIA_DELETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  /**
   * Emit tracking events
   */
  emitTrackingStarted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.TRACKING_STARTED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitTrackingUpdated(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.TRACKING_UPDATED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }

  emitTrackingCompleted(payload: any, tenantId?: string, organisationId?: string, userId?: string): void {
    this.emit({
      type: LmsEventType.TRACKING_COMPLETED,
      payload,
      tenantId,
      organisationId,
      userId,
    });
  }
} 