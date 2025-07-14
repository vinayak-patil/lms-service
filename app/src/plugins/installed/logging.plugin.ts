import { EventEmitter2 } from '@nestjs/event-emitter';
import { AbstractPlugin } from '../../plugins/base.plugin';
import { LmsEvent, LmsEventType } from '../../events/lms.events';

export default class LoggingPlugin extends AbstractPlugin {
  name = 'LoggingPlugin';
  version = '1.0.0';
  description = 'Logs all LMS events for debugging and monitoring';

  register(eventEmitter: EventEmitter2): void {
    // Listen to all LMS events
    eventEmitter.on('lms.event', async (event: LmsEvent) => {
      this.log(`Event: ${event.type}`, {
        payload: event.payload,
        timestamp: event.timestamp || new Date(),
        tenantId: event.tenantId,
        organisationId: event.organisationId,
        userId: event.userId,
      });
    });

    // Listen to specific event types for more detailed logging
    eventEmitter.on(LmsEventType.LESSON_COMPLETED, async (payload: any) => {
      this.log(`Lesson completed: ${payload.lessonId} by user ${payload.userId}`, {
        score: payload.score,
        progress: payload.progress,
        courseId: payload.courseId,
      });
    });

    eventEmitter.on(LmsEventType.COURSE_COMPLETED, async (payload: any) => {
      this.log(`Course completed: ${payload.courseId} by user ${payload.userId}`, {
        totalLessons: payload.totalLessons,
        completedLessons: payload.completedLessons,
        finalScore: payload.finalScore,
      });
    });

    eventEmitter.on(LmsEventType.LESSON_ATTEMPTED, async (payload: any) => {
      this.log(`Lesson attempted: ${payload.lessonId} by user ${payload.userId}`, {
        attemptId: payload.attemptId,
        attemptNumber: payload.attemptNumber,
        courseId: payload.courseId,
      });
    });

    this.log('Logging plugin registered successfully');
  }

  unregister(eventEmitter: EventEmitter2): void {
    eventEmitter.removeAllListeners('lms.event');
    eventEmitter.removeAllListeners(LmsEventType.LESSON_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.COURSE_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.LESSON_ATTEMPTED);
    this.log('Logging plugin unregistered');
  }
} 