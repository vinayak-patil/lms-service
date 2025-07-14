import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { MediaModule } from './media/media.module';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './common/database.module';
import { CoursesModule } from './courses/courses.module';
import { AppService } from './app.service';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './cache/cache.module';
import { TrackingModule } from './tracking/tracking.module';
import { CloudStorageModule } from '@vinayak-patil/cloud-storage';
import { ConfigurationModule } from './configuration/configuration.module';
import { PluginsModule } from './plugins/plugins.module';
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    CloudStorageModule.register({
      provider: process.env.CLOUD_STORAGE_PROVIDER as 'aws' | 'azure' | 'gcp',
      region: process.env.CLOUD_STORAGE_REGION,
      credentials: {
        accessKeyId: process.env.CLOUD_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY,
      },
      bucket: process.env.CLOUD_STORAGE_BUCKET_NAME,
    }),
    CacheModule,
    DatabaseModule,
    CommonModule,
    ConfigurationModule,
    PluginsModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    MediaModule,
    EnrollmentsModule,
    HealthModule,
    TrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule{}