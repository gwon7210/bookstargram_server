import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, originalUrl } = request;
    const path = originalUrl || request.url;
    const startedAt = Date.now();

    this.logger.log(`Incoming ${method} ${path}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        const status = response.statusCode;
        this.logger.log(`${method} ${path} ${status} +${duration}ms`);
      }),
    );
  }
}
