import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from '../modules/entities/module.entity';
import { CourseLesson } from '../lessons/entities/course-lesson.entity';
import { CourseTrack } from '../tracking/entities/course-track.entity';
import { LessonTrack } from '../tracking/entities/lesson-track.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CommonModule } from '../common/common.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, CourseLesson, CourseTrack, LessonTrack]),
    CommonModule,
    CacheModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}