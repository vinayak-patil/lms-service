import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';    
import { ConfigDto } from './dto/configuration.dto';
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
    type: ConfigDto 
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

  @Post('sync/:tenantId')
  @ApiOperation({ summary: 'Sync configuration from external service' })
  @ApiParam({ name: 'tenantId', description: 'Tenant identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuration synced successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid tenant ID' })
  @ApiResponse({ status: 500, description: 'Failed to sync configuration' })
  async syncExternalConfig(@Param('tenantId') tenantId: string) {
    return this.configurationService.syncExternalConfig(tenantId);
  }
} 