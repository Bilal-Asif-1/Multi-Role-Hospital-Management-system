import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, user, body, params, query } = request;
    
    // Skip audit logging for audit endpoints to avoid recursion
    if (url.includes('/audit/')) {
      return next.handle();
    }

    const ipAddress = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Determine action and entity type from route
    const action = this.getAction(method, url);
    const entityType = this.getEntityType(url);

    return next.handle().pipe(
      tap((response) => {
        // Log the activity asynchronously (don't block the response)
        setImmediate(() => {
          this.auditService.logActivity({
            userId: (user as any)?.id,
            userEmail: (user as any)?.email,
            action,
            entityType,
            entityId: params?.id || body?.id,
            description: `${method} ${url}`,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent,
            changes: {
              params,
              query,
              body: this.sanitizeBody(body),
            },
            metadata: {
              method,
              url,
              statusCode: context.switchToHttp().getResponse().statusCode,
            },
          });
        });
      }),
    );
  }

  private getAction(method: string, url: string): string {
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/register')) return 'REGISTER';
    if (url.includes('/logout')) return 'LOGOUT';
    if (method === 'POST') return 'CREATE';
    if (method === 'PATCH' || method === 'PUT') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return 'VIEW';
  }

  private getEntityType(url: string): string {
    if (url.includes('/users')) return 'User';
    if (url.includes('/patients')) return 'Patient';
    if (url.includes('/appointments')) return 'Appointment';
    if (url.includes('/visit-notes')) return 'VisitNote';
    if (url.includes('/lab-records')) return 'LabRecord';
    if (url.includes('/prescriptions')) return 'Prescription';
    if (url.includes('/invoices')) return 'Invoice';
    if (url.includes('/doctors')) return 'Doctor';
    return 'System';
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    // Remove sensitive fields
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.token) sanitized.token = '***';
    return sanitized;
  }
}

