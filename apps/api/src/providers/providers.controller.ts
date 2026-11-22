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
