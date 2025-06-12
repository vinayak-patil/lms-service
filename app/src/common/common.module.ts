import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './services/file-upload.service';
import { ConfigurationModule } from '../configuration/configuration.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule,
    ConfigurationModule,
    TenantModule,
  ],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class CommonModule {}
