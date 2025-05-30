import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { UserEnrollment } from './entities/user-enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseTrack } from '../tracking/entities/course-track.entity';
import { CacheModule } from '../cache/cache.module';
import { CourseLesson } from 'src/lessons/entities/course-lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEnrollment,
      Course,
      CourseTrack,
      CourseLesson,
    ]),
    ConfigModule,
    CacheModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
