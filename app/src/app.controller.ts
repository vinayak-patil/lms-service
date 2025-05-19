import { Controller, Get, Request, UseGuards, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  
  @Get('test-api-id')
  @ApiOperation({ summary: 'Test endpoint for API ID' })
  @ApiResponse({ status: 200, description: 'Test response with API ID' })
  async testApiId() {
    // Set a test API ID
    this.setApiId('api.test.endpoint');
    return { message: 'Test endpoint' };
  }

  private setApiId(apiId: string) {
    const req = this.getRequest();
    if (req) {
      req['apiId'] = apiId;
    }
  }

  private getRequest() {
    try {
      const req = global['reqContext'];
      return req;
    } catch (e) {
      return null;
    }
  }
}