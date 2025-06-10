import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantContext } from './tenant.context';
import { TenantMiddleware } from './tenant.middleware';

@Module({
  imports: [ConfigModule],
  providers: [TenantContext],
  exports: [TenantContext],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // This will apply the middleware to all routes
  }
}
