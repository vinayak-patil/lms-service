import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationModule } from '../configuration/configuration.module';  
import { TenantModule } from './tenant/tenant.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    ConfigModule,
    ConfigurationModule,
    TenantModule,
    EventsModule,
  ],
  exports: [],
})
export class CommonModule {}
