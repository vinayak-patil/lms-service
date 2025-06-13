import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule,
    ConfigurationModule,
    TenantModule,
  ],
  exports: [],
})
export class CommonModule {}
