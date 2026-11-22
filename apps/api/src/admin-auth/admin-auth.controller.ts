
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminSessionService } from './admin-session.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';

const COOKIE_NAME = 'gsm_admin_session';

function getSessionToken(request: Request): string | undefined {
  const cookies = request.headers.cookie ?? '';

  const sessionCookie = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  return sessionCookie
    ? decodeURIComponent(sessionCookie.slice(COOKIE_NAME.length + 1))
    : undefined;
}

@Controller('api/admin/auth')
@UseGuards(ThrottlerGuard)
export class AdminAuthController {
  constructor(
    private readonly authService: AdminAuthService,
    private readonly sessionService: AdminSessionService,
  ) {}

  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(
    @Body()
    body: {
      fullName: string;
      email: string;
      password: string;
      bootstrapSecret: string;
    },
  ) {
    return this.authService.createFirstSuperAdmin(
      body.fullName,
      body.email,
      body.password,
      body.bootstrapSecret,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const admin = await this.authService.verifyAdminLogin(
      body.email,
      body.password,
    );

    await this.sessionService.createSession(admin.id, response);

    return {
      message: 'Administrator login successful.',
      admin,
    };
  }
  @UseGuards(AdminAuthGuard)
  @Get('me')
  async me(@Req() request: Request) {
    const token = getSessionToken(request);

    if (!token) {
      throw new UnauthorizedException('Administrator session required.');
    }

    return this.sessionService.validateSession(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sessionService.destroySession(
      getSessionToken(request),
      response,
    );
  }
}
