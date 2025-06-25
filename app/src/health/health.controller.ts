import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  async checkHealth() {
    let dbStatus = 'disconnected';

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.release();
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      db: dbStatus,
    };
  }
}