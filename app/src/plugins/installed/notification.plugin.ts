import { EventEmitter2 } from '@nestjs/event-emitter';
import { AbstractPlugin } from '../../plugins/base.plugin';
import { LmsEventType } from '../../events/lms.events';

export default class NotificationPlugin extends AbstractPlugin {
  name = 'NotificationPlugin';
  version = '1.0.0';
  description = 'Sends notifications for important LMS events';

  register(eventEmitter: EventEmitter2): void {
    // Send notification when course is completed
    eventEmitter.on(LmsEventType.COURSE_COMPLETED, async (payload: any) => {
      await this.sendCourseCompletionNotification(payload);
    });

    // Send notification when lesson is completed
    eventEmitter.on(LmsEventType.LESSON_COMPLETED, async (payload: any) => {
      await this.sendLessonCompletionNotification(payload);
    });

    // Send notification when user enrolls in a course
    eventEmitter.on(LmsEventType.ENROLLMENT_CREATED, async (payload: any) => {
      await this.sendEnrollmentNotification(payload);
    });

    // Send notification when lesson is attempted
    eventEmitter.on(LmsEventType.LESSON_ATTEMPTED, async (payload: any) => {
      await this.sendLessonAttemptNotification(payload);
    });

    this.log('Notification plugin registered successfully');
  }

  private async sendCourseCompletionNotification(payload: any): Promise<void> {
    const notification = {
      type: 'course_completion',
      userId: payload.userId,
      courseId: payload.courseId,
      title: 'Course Completed! 🎉',
      message: `Congratulations! You have successfully completed the course "${payload.courseTitle || payload.courseId}".`,
      data: {
        courseId: payload.courseId,
        finalScore: payload.finalScore,
        totalLessons: payload.totalLessons,
        completedLessons: payload.completedLessons,
        certificateUrl: payload.certificateUrl,
      },
      priority: 'high',
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
    this.log(`Course completion notification sent to user ${payload.userId}`, {
      courseId: payload.courseId,
      finalScore: payload.finalScore,
    });
  }

  private async sendLessonCompletionNotification(payload: any): Promise<void> {
    const notification = {
      type: 'lesson_completion',
      userId: payload.userId,
      lessonId: payload.lessonId,
      courseId: payload.courseId,
      title: 'Lesson Completed! 📚',
      message: `Great job! You have completed the lesson "${payload.lessonTitle || payload.lessonId}".`,
      data: {
        lessonId: payload.lessonId,
        courseId: payload.courseId,
        score: payload.score,
        progress: payload.progress,
        nextLessonId: payload.nextLessonId,
      },
      priority: 'medium',
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
    this.log(`Lesson completion notification sent to user ${payload.userId}`, {
      lessonId: payload.lessonId,
      score: payload.score,
    });
  }

  private async sendEnrollmentNotification(payload: any): Promise<void> {
    const notification = {
      type: 'enrollment_created',
      userId: payload.userId,
      courseId: payload.courseId,
      title: 'Welcome to Your New Course! 🎓',
      message: `You have been successfully enrolled in "${payload.courseTitle || payload.courseId}". Start your learning journey now!`,
      data: {
        courseId: payload.courseId,
        enrollmentId: payload.enrollmentId,
        startDate: payload.startDate,
        courseDescription: payload.courseDescription,
      },
      priority: 'high',
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
    this.log(`Enrollment notification sent to user ${payload.userId}`, {
      courseId: payload.courseId,
      enrollmentId: payload.enrollmentId,
    });
  }

  private async sendLessonAttemptNotification(payload: any): Promise<void> {
    const notification = {
      type: 'lesson_attempt',
      userId: payload.userId,
      lessonId: payload.lessonId,
      courseId: payload.courseId,
      title: 'Lesson Attempt Started 📝',
      message: `You have started attempting the lesson "${payload.lessonTitle || payload.lessonId}". Good luck!`,
      data: {
        lessonId: payload.lessonId,
        courseId: payload.courseId,
        attemptId: payload.attemptId,
        attemptNumber: payload.attemptNumber,
        maxAttempts: payload.maxAttempts,
      },
      priority: 'low',
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
    this.log(`Lesson attempt notification sent to user ${payload.userId}`, {
      lessonId: payload.lessonId,
      attemptNumber: payload.attemptNumber,
    });
  }

  private async sendNotification(notification: any): Promise<void> {
    // This is a mock implementation
    // In a real application, you would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Push notification service (Firebase, OneSignal, etc.)
    // - In-app notification system
    // - SMS service (Twilio, etc.)

    try {
      // Simulate sending notification
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Log the notification (in production, this would be sent to actual services)
      this.log(`Notification sent: ${notification.type}`, {
        userId: notification.userId,
        title: notification.title,
        priority: notification.priority,
      });

      // Here you would add actual notification sending logic:
      // await this.emailService.sendEmail(notification);
      // await this.pushNotificationService.sendPush(notification);
      // await this.smsService.sendSMS(notification);
      
    } catch (error) {
      this.error(`Failed to send notification: ${error.message}`, {
        notificationType: notification.type,
        userId: notification.userId,
      });
    }
  }

  unregister(eventEmitter: EventEmitter2): void {
    eventEmitter.removeAllListeners(LmsEventType.COURSE_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.LESSON_COMPLETED);
    eventEmitter.removeAllListeners(LmsEventType.ENROLLMENT_CREATED);
    eventEmitter.removeAllListeners(LmsEventType.LESSON_ATTEMPTED);
    this.log('Notification plugin unregistered');
  }
} 