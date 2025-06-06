import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { API_IDS } from '../common/constants/api-ids.constant';
import { CommonQueryDto } from '../common/dto/common-query.dto';
import { ApiId } from '../common/decorators/api-id.decorator';
import { Lesson } from './entities/lesson.entity';
import { TenantOrg } from '../common/decorators/tenant-org.decorator';
import { UploadService } from '../common/services/upload.service';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiId(API_IDS.CREATE_LESSON)
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Lesson created successfully', 
    type: Lesson 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createLesson(
    @Body() createLessonDto: CreateLessonDto,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let lesson: Lesson;
    if (file) {
      // First create the lesson to get the generated ID
      lesson = await this.lessonsService.create(
        createLessonDto,
        query.userId,
        tenantOrg.tenantId,
        tenantOrg.organisationId,
      );
      
      // Then upload the file using the generated lessonId
      const imageUrl = await this.uploadService.uploadFile(file, {
        type: 'lesson',
        courseId: lesson.courseId,
        moduleId: lesson.moduleId,
        lessonId: lesson.lessonId,
      });
      
      // Update the lesson with the image URL
      lesson = await this.lessonsService.update(
        lesson.lessonId,
        { ...createLessonDto, image: imageUrl },
        query.userId,
        tenantOrg.tenantId,
        tenantOrg.organisationId,
      );
    } else {
      lesson = await this.lessonsService.create(
        createLessonDto,
        query.userId,
        tenantOrg.tenantId,
        tenantOrg.organisationId,
      );
    }
    return lesson;
  }

  @Get()
  @ApiId(API_IDS.GET_ALL_LESSONS)
  @ApiOperation({ summary: 'Get all lessons' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['published', 'unpublished', 'archived'] })
  @ApiQuery({ name: 'format', required: false, enum: ['video', 'document', 'quiz', 'event'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllLessons(
    @Query() paginationDto: PaginationDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
    @Query('status') status?: string,
    @Query('format') format?: string,
  ) {
    return this.lessonsService.findAll(
      paginationDto, 
      status, 
      format, 
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
  }
  
  @Get(':lessonId')
  @ApiId(API_IDS.GET_LESSON_BY_ID)
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiParam({ name: 'lessonId', type: String, format: 'uuid' })
  async getLessonById(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    return this.lessonsService.findOne(
      lessonId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
  }

  @Get('module/:moduleId')
  @ApiId(API_IDS.GET_LESSONS_BY_MODULE)
  @ApiOperation({ summary: 'Get lessons by module ID' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiParam({ name: 'moduleId', type: String, format: 'uuid' })
  async getLessonsByModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    return this.lessonsService.findByModule(
      moduleId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
  }

  @Put(':lessonId')
  @ApiId(API_IDS.UPDATE_LESSON)
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson updated successfully', 
    type: Lesson 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string }, 
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let lesson: Lesson;
    if (file) {
      // Get the existing lesson to get the courseId and moduleId
      const existingLesson = await this.lessonsService.findOne(
        lessonId,
        tenantOrg.tenantId,
        tenantOrg.organisationId,
      );
      
      // Upload the file using the existing lessonId
      const imageUrl = await this.uploadService.uploadFile(file, {
        type: 'lesson',
        courseId: existingLesson.courseId,
        moduleId: existingLesson.moduleId,
        lessonId,
      });
      
      // Update the lesson with the new image URL
      lesson = await this.lessonsService.update(
        lessonId,
        { ...updateLessonDto, image: imageUrl },
        query.userId,
        tenantOrg.tenantId,
        tenantOrg.organisationId,
      );
    } else {
      lesson = await this.lessonsService.update(
        lessonId,
        updateLessonDto,
        query.userId,
        tenantOrg.tenantId,
        tenantOrg.organisationId,
      );
    }
    return lesson;
  }

  @Delete(':lessonId')
  @ApiId(API_IDS.DELETE_LESSON)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiParam({ name: 'lessonId', type: String, format: 'uuid' })
  async deleteLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query() query: CommonQueryDto,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    return this.lessonsService.remove(
      lessonId,
      query.userId,
      tenantOrg.tenantId,
      tenantOrg.organisationId
    );
  }

}
