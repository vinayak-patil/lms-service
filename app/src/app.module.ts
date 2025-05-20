import { Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { DatabaseModule } from './common/database.module';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    
    // Database
    DatabaseModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
