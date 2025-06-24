import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';    
<<<<<<< HEAD
import { ConfigDto } from './dto/configuration.dto';
=======
>>>>>>> 8995570a75181566749a203c6735b838241e925a
import { TenantOrg } from 'src/common/decorators/tenant-org.decorator';
import { response } from 'express';

@ApiTags('Configuration')
@Controller('config')
export class ConfigController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get(':entityType')
  @ApiOperation({ summary: 'Get LMS configuration' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration retrieved successfully',
<<<<<<< HEAD
    type: ConfigDto 
=======
>>>>>>> 8995570a75181566749a203c6735b838241e925a
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async getConfig(
    @Param('entityType') entityType: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string },
  ) {
    return this.configurationService.getConfig(
      entityType,
      tenantOrg.tenantId,
    );
  }

<<<<<<< HEAD
  @Post('sync/:tenantId')
  @ApiOperation({ summary: 'Sync configuration from external service' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
=======
  @Post('sync')
  @ApiOperation({ summary: 'Sync configuration from external service' })
>>>>>>> 8995570a75181566749a203c6735b838241e925a
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration synced successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid tenant ID' })
  @ApiResponse({ status: 500, description: 'Failed to sync configuration' })
<<<<<<< HEAD
  async syncExternalConfig(@Param('tenantId') tenantId: string) {
    return this.configurationService.syncExternalConfig(tenantId);
=======
  async syncTenantConfig(@TenantOrg() tenantOrg: { tenantId: string; organisationId: string }) {
    return this.configurationService.syncTenantConfig(tenantOrg.tenantId);
>>>>>>> 8995570a75181566749a203c6735b838241e925a
  }
} 