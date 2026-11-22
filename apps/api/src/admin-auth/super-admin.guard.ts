import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type AdminRequest = Request & {
  admin?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
};

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    if (request.admin?.role !== 'super_admin') {
      throw new ForbiddenException(
        'Super Administrator access is required.',
      );
    }

    return true;
  }
}
