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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ProvidersService } from './providers.service.js';
import { AdminSessionService } from '../admin-auth/admin-session.service.js';
import { DatabaseService } from '../database/database.service.js';
import { ProviderSessionService } from './provider-session.service.js';
import {
  ProviderLoginDto,
  ProviderRegisterDto,
} from './provider-auth.dto.js';

const COOKIE_NAME = 'gsm_provider_session';

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

@Controller('providers')
export class ProvidersController {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly sessions: ProviderSessionService,
    private readonly adminSessions: AdminSessionService,
    private readonly database: DatabaseService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() body: ProviderRegisterDto) {
    return this.providersService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(
    @Body() body: ProviderLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.providersService.login(
      body.phone,
      body.password,
      response,
    );
  }

  @Get('me')
  async me(@Req() request: Request) {
    const token = getSessionToken(request);

    if (!token) {
      throw new UnauthorizedException('Provider session required.');
    }

    return this.sessions.validateSession(token);
  }

  @Post('admin-session')
  @HttpCode(HttpStatus.OK)
  async createAdminSession(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const providerToken = getSessionToken(request);

    if (!providerToken) {
      throw new UnauthorizedException('Provider session required.');
    }

    const provider = await this.sessions.validateSession(providerToken);

    const result = await this.database.query(
      `SELECT a.id
       FROM providers p
       JOIN administrators a ON a.id = p.linked_admin_id
       WHERE p.id = $1
         AND a.role = 'super_admin'
         AND a.is_active = TRUE
       LIMIT 1`,
      [provider.id],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('This provider account is not authorized for administrator access.');
    }

    await this.adminSessions.createSession(result.rows[0].id, response);

    return {
      success: true,
      message: 'Administrator session created.',
    };
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.sessions.destroySession(
      getSessionToken(request),
      response,
    );
  }
}
