
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminSessionService } from './admin-session.service.js';

const COOKIE_NAME = 'gsm_admin_session';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: AdminSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const cookies = request.headers.cookie ?? '';

    const sessionCookie = cookies
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

    const token = sessionCookie
      ? decodeURIComponent(
          sessionCookie.slice(COOKIE_NAME.length + 1),
        )
      : undefined;

    if (!token) {
      throw new UnauthorizedException(
        'Administrator login is required.',
      );
    }

    const admin = await this.sessionService.validateSession(token);

   (request as Request & { admin: typeof admin }).admin = admin;

    return true;
  }
}
