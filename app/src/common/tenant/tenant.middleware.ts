import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContext,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['tenantid'] as string;
    
    this.tenantContext.setTenantId(tenantId);
    next();
  }
} 