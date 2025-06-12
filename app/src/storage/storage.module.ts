import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { ConfigurationModule } from '../configuration/configuration.module';

@Module({
  imports: [ConfigModule, ConfigurationModule],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {} 