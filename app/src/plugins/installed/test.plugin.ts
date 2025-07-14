import { EventEmitter2 } from '@nestjs/event-emitter';
import { AbstractPlugin } from '../../plugins/base.plugin';
import { LmsEventType } from '../../events/lms.events';

export default class TestPlugin extends AbstractPlugin {
  name = 'TestPlugin';
  version = '1.0.0';
  description = 'Test plugin to verify the plugin system is working';

  register(eventEmitter: EventEmitter2): void {
    // Listen to all LMS events
    eventEmitter.on('lms.event', async (event: any) => {
      this.log(`[TEST] Event received: ${event.type}`, {
        payload: event.payload,
        timestamp: event.timestamp,
      });
    });

    // Listen to specific events
    eventEmitter.on(LmsEventType.COURSE_CREATED, async (payload: any) => {
      this.log(`[TEST] Course created: ${payload.courseId}`, payload);
    });

    eventEmitter.on(LmsEventType.LESSON_COMPLETED, async (payload: any) => {
      this.log(`[TEST] Lesson completed: ${payload.lessonId} by user ${payload.userId}`, payload);
    });

    eventEmitter.on(LmsEventType.ENROLLMENT_CREATED, async (payload: any) => {
      this.log(`[TEST] User enrolled: ${payload.userId} in course ${payload.courseId}`, payload);
    });

    this.log('[TEST] TestPlugin registered successfully');
  }

  unregister(eventEmitter: EventEmitter2): void {
    eventEmitter.removeAllListeners('lms.event');
    eventEmitter.removeAllListeners(LmsEventType.COURSE_CREATED);
    eventEmitter.removeAllListeners(LmsEventType.LESSON_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.ENROLLMENT_CREATED);
    this.log('[TEST] TestPlugin unregistered');
  }
} 