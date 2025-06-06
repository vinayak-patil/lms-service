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
  Patch,
  BadRequestException,
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
import { TransactionService } from '../common/services/transaction.service';


@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly uploadService: UploadService,
    private readonly transactionService: TransactionService,
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
    // Validate file if provided
    if (file) {
      await this.uploadService.validateFile(file, { type: 'lesson' });
    }

    let uploadedFileUrl: string | undefined;

    try {
      return await this.transactionService.executeInTransaction(async (entityManager) => {
        // Create lesson first to get the lessonId
        const lesson = await this.lessonsService.create(
          createLessonDto,
          query.userId,
          tenantOrg.tenantId,
          tenantOrg.organisationId,
          entityManager,
        );

        // Upload file if provided
        if (file) {
          uploadedFileUrl = await this.uploadService.uploadFile(file, {
            type: 'lesson',
            courseId: lesson.courseId,
            moduleId: lesson.moduleId,
            lessonId: lesson.lessonId,
          });

          // Update lesson with the file URL
          const updatedLesson = await this.lessonsService.update(
            lesson.lessonId,
            { image: uploadedFileUrl },
            query.userId,
            tenantOrg.tenantId,
            tenantOrg.organisationId,
            entityManager,
          );

          return updatedLesson;
        }

        return lesson;
      });
    } catch (error) {
      // If transaction fails and we uploaded a file, clean it up
      if (uploadedFileUrl) {
        try {
          await this.uploadService.deleteFile(uploadedFileUrl);
        } catch (cleanupError) {
          // Log cleanup error but throw the original error
          console.error('Failed to clean up uploaded file:', cleanupError);
        }
      }
      throw error;
    }
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

  @Patch(':lessonId')
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
    // Validate file if provided
    if (file) {
      await this.uploadService.validateFile(file, { type: 'lesson' });
    }

    let uploadedFileUrl: string | undefined;
    let oldFileUrl: string | undefined;

    try {
      return await this.transactionService.executeInTransaction(async (entityManager) => {
        // Get existing lesson to check courseId and moduleId
        const existingLesson = await this.lessonsService.findOne(
          lessonId,
          tenantOrg.tenantId,
          tenantOrg.organisationId
        );
        if (!existingLesson) {
          throw new BadRequestException('Lesson not found');
        }

        // Store old file URL for cleanup if needed
        oldFileUrl = existingLesson.image;

        // Upload file if provided
        if (file) {
          uploadedFileUrl = await this.uploadService.uploadFile(file, {
            type: 'lesson',
            courseId: existingLesson.courseId,
            moduleId: existingLesson.moduleId,
            lessonId: existingLesson.lessonId,
          });
        }

        // Update lesson with uploaded file URL
        const lesson = await this.lessonsService.update(
          lessonId,
          {
            ...updateLessonDto,
            image: uploadedFileUrl,
          },
          query.userId,
          tenantOrg.tenantId,
          tenantOrg.organisationId,
          entityManager,
        );

        return lesson;
      });
    } catch (error) {
      // If transaction fails and we uploaded a new file, clean it up
      if (uploadedFileUrl) {
        try {
          await this.uploadService.deleteFile(uploadedFileUrl);
        } catch (cleanupError) {
          // Log cleanup error but throw the original error
          console.error('Failed to clean up uploaded file:', cleanupError);
        }
      }
      throw error;
    }
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
