import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { API_IDS } from '../common/constants/api-ids.constant';
import { ACTIONS } from '../common/constants/rbac-actions.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateCourseTrackingDto } from './dto/update-course-tracking.dto';
import { ApiId } from 'src/common/decorators/api-id.decorator';
import { CommonQueryDto } from 'src/common/dto/common-query.dto';
import { StartLessonTrackingDto } from './dto/start-lesson-tracking.dto';
import { UpdateLessonTrackingDto } from './dto/update-lesson-tracking.dto';

@ApiTags('Tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {
  }

  @Post('course/start/:courseId')
  @ApiId(API_IDS.START_COURSE_TRACKING)
  @ApiOperation({ summary: 'Start tracking a course' })
  @ApiBody({ type: UpdateCourseTrackingDto })
  @ApiResponse({ status: 201, description: 'Course tracking started successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async startCourseTracking(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: CommonQueryDto
  ) {
      
    return this.trackingService.startCourseTracking(
      courseId, 
      query.userId, 
      query.tenantId, 
      query.organisationId
    );
  }

  @Post('course/update')
  @ApiId(API_IDS.UPDATE_COURSE_TRACKING)
  @ApiOperation({ summary: 'Update course tracking progress' })
  @ApiBody({ type: UpdateCourseTrackingDto })
  @ApiResponse({ status: 200, description: 'Course tracking updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateCourseTracking(
    @Body() updateCourseTrackingDto: UpdateCourseTrackingDto,
    @Query() query: CommonQueryDto
  ) {    
    return this.trackingService.updateCourseTracking(
      updateCourseTrackingDto,
      query.userId,
      query.tenantId,
      query.organisationId,      
    );
  }

  @Get('course/:courseId')
  @ApiId(API_IDS.GET_COURSE_TRACKING)
  @ApiOperation({ summary: 'Get course tracking status' })
  @ApiParam({ name: 'courseId', description: 'The course ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Course tracking data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getCourseTracking(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: CommonQueryDto
  ) {
    return this.trackingService.getCourseTracking(
      courseId, 
      query.userId,
      query.tenantId,
      query.organisationId
    );
  }

  @Post('lesson/start')
  @ApiId(API_IDS.START_LESSON_TRACKING)
  @ApiOperation({ summary: 'Start tracking a lesson' })
  @ApiBody({ type: StartLessonTrackingDto })
  @ApiResponse({ status: 201, description: 'Lesson tracking started' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async startLessonTracking(
    @Body() startLessonTrackingDto: StartLessonTrackingDto,
    @Query() query: CommonQueryDto
  ) {    
    return this.trackingService.startLessonTracking(
      startLessonTrackingDto,
      query.userId,
      query.tenantId,
      query.organisationId
    );
  }

  @Post('lesson/update')
  @ApiId(API_IDS.UPDATE_LESSON_TRACKING)
  @ApiOperation({ summary: 'Update lesson tracking progress' })
  @ApiBody({ type: UpdateLessonTrackingDto })
  @ApiResponse({ status: 200, description: 'Lesson tracking updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async updateLessonTracking(
    @Body() updateLessonTrackingDto: UpdateLessonTrackingDto,
    @Query() query: CommonQueryDto
  ) {
    const trackingData = {
      ...updateLessonTrackingDto,
      userId: query.userId,
      tenantId: query.tenantId,
      organisationId: query.organisationId,
    };
   
    return this.trackingService.updateLessonTracking(trackingData);
  }

  @Post('lesson/complete')
  @ApiId(API_IDS.COMPLETE_LESSON_TRACKING)
  @ApiOperation({ summary: 'Mark a lesson as completed' })
  @ApiBody({ type: UpdateLessonTrackingDto })
  @ApiResponse({ status: 200, description: 'Lesson marked as completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async completeLessonTracking(
    @Body() updateLessonTrackingDto: UpdateLessonTrackingDto,
    @Query() query: CommonQueryDto
  ) {
    const trackingData = {
      ...updateLessonTrackingDto,
      userId: query.userId,
      tenantId: query.tenantId,
      organisationId: query.organisationId,
    };
    
    return this.trackingService.completeLessonTracking(trackingData);
  }

  @Get('lesson/:lessonId')
  @ApiId(API_IDS.GET_LESSON_TRACKING)
  @ApiOperation({ summary: 'Get lesson tracking status' })
  @ApiParam({ name: 'lessonId', description: 'The lesson ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson tracking data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getLessonTracking(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query('courseId') courseId: string,
    @Request() req,
  ) {
    return this.trackingService.getLessonTracking(
      lessonId, 
      req.user.userId, 
      courseId,
      req.user.tenantId,
      req.user.orgId
    );
  }

  @Get('lesson/:lessonId/history')
  @ApiId(API_IDS.GET_LESSON_TRACKING_HISTORY)
  @ApiOperation({ summary: 'Get lesson tracking history' })
  @ApiParam({ name: 'lessonId', description: 'The lesson ID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson tracking history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getLessonTrackingHistory(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query('courseId') courseId: string,
    @Query() paginationDto: PaginationDto,
    @Request() req,
  ) {
    return this.trackingService.getLessonTrackingHistory(
      lessonId,
      req.user.userId,
      courseId,
      paginationDto,
      req.user.tenantId,
      req.user.orgId
    );
  }
}